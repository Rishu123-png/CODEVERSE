/* global process, console, window */
// Self-contained isolated viewer/check for the NEW real foliage-source exports.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from '../../node_modules/playwright/index.mjs';
const { build } = await import(
  pathToFileURL(
    path.resolve('.cache/a1/tools/node_modules/esbuild/lib/main.js'),
  ).href
);
await fs.mkdir('.cache/a1/final-vegetation', { recursive: true });
const source = JSON.parse(
  await fs.readFile(
    'docs/evidence/a1-final/vegetation-inspection.json',
    'utf8',
  ),
);
for (const v of source.variants)
  await fs.copyFile(
    '.cache/a1-final/generated/' + v.file,
    '.cache/a1/final-vegetation/' + v.file,
  );
const code = `
import * as B from './tools/node_modules/@babylonjs/core/index.js';
import './tools/node_modules/@babylonjs/loaders/glTF/index.js';
const canvas=document.querySelector('canvas'),engine=new B.Engine(canvas,true,{preserveDrawingBuffer:true});
if(engine.webGLVersion!==2)throw new Error('Requires explicit WebGL2; no backend fallback');
const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.clearColor=new B.Color4(.17,.24,.31,1);
const camera=new B.ArcRotateCamera('A1 source vegetation',Math.PI/2+.1,1.25,31,new B.Vector3(0,3,0),scene);camera.attachControl(canvas,true);camera.minZ=.1;
new B.HemisphericLight('sky',new B.Vector3(0,1,0),scene).intensity=1;
new B.DirectionalLight('sun',new B.Vector3(-.5,-1,-.4),scene).intensity=2;
const ground=B.MeshBuilder.CreateGround('diagnostic-ground-NOT-plaza',{width:36,height:16},scene);const gm=new B.StandardMaterial('diagnostic neutral',scene);gm.diffuseColor=new B.Color3(.29,.32,.3);ground.material=gm;
const observations=[];
for(let level=0;level<3;level++)for(const preset of ['ash_medium','bush_1']){
 const file=preset+'-lod'+level+'.glb',c=await B.LoadAssetContainerAsync('/final-vegetation/'+file,scene);c.addAllToScene();
 const root=c.meshes.find(m=>!m.parent);root.position.x=(level-1)*10;root.position.z=preset==='bush_1'?4:0;
 const leaves=c.materials.find(m=>m.name.includes('leaf cutout'));
 if(!leaves||leaves.alphaCutOff!==.5||leaves.backFaceCulling!==false)throw new Error('Leaf cutout properties not preserved: '+file);
 await scene.whenReadyAsync();
 observations.push({file,triangles:c.meshes.reduce((s,m)=>s+m.getTotalIndices()/3,0),meshes:c.meshes.filter(m=>m.getTotalVertices()).length,alphaCutoff:leaves.alphaCutOff,doubleSided:!leaves.backFaceCulling,textureSize:leaves.albedoTexture.getSize(),textureReady:leaves.albedoTexture.isReady()});
}
scene.render();engine.runRenderLoop(()=>scene.render());window.addEventListener('resize',()=>engine.resize());
window.vegetationEvidence={scope:'Real MIT leaf texture/static tree source review; no MPFB, no G1, no accepted foliage or hardware performance',babylon:B.Engine.Version,backend:'WebGL2',observations,wind:false,bark:'scalar diagnostic',ground:'diagnostic only',lodSwitching:'none; levels shown side-by-side, no pop/coverage acceptance',textureObjects:scene.textures.length};
window.vegetationDispose=()=>{scene.dispose();engine.dispose();return{sceneDisposed:scene.isDisposed,engineScenes:engine.scenes.length};};window.vegetationReady=true;
`;
await build({
  stdin: {
    contents: code,
    resolveDir: path.resolve('.cache/a1'),
    sourcefile: 'a1-real-foliage.js',
  },
  outfile: '.cache/a1/vegetation-bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'warning',
});
await fs.writeFile(
  '.cache/a1/vegetation.html',
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>A1 foliage source review</title><style>body{margin:0;background:#142330;color:#ecf3f8;font:14px system-ui}header{padding:18px 24px}h1{font-size:20px;margin:0 0 8px}p{margin:4px 0;color:#ffda9c}canvas{width:100%;height:calc(100vh - 115px);display:block;touch-action:none}</style></head><body><header><h1>CodeVerse · A1 vegetation source review / NOT final scene</h1><p>Left LOD0 · center LOD1 · right LOD2. 8 m ash + 1.2 m shrub. Real MIT leaf alpha texture; scalar bark; no wind.</p><p>Diagnostic ground only · no premium-art or HP Victus performance acceptance · G1 NOT STARTED</p></header><canvas></canvas><script type="module" src="/vegetation-bundle.js"></script></body></html>`,
);
const browser = await chromium.launch({
  executablePath: path.resolve('.cache/browser/chromium'),
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
  env: { ...process.env, LD_LIBRARY_PATH: path.resolve('.cache/browser/lib') },
});
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 950 },
    }),
    errors = [],
    external = [],
    failed = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.stack);
  });
  page.on('requestfailed', (r) => failed.push(r.url()));
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (
      !u.startsWith('http://127.0.0.1:5181/') &&
      !u.startsWith('data:') &&
      !u.startsWith('blob:')
    ) {
      external.push(u);
      await route.abort();
    } else await route.continue();
  });
  await page.goto('http://127.0.0.1:5181/vegetation.html');
  await page.waitForFunction(
    () => window.vegetationReady,
    {},
    { timeout: 45000 },
  );
  const r = await page.evaluate(() => window.vegetationEvidence);
  assert.equal(r.observations.length, 6);
  for (const o of r.observations) {
    assert.equal(
      o.triangles,
      source.variants.find((v) => v.file === o.file).triangles,
    );
    assert.equal(o.textureReady, true);
    assert.equal(o.textureSize.width, 1024);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(failed, []);
  await page.screenshot({
    path: 'docs/evidence/a1-final/vegetation-source-review.png',
    fullPage: true,
  });
  r.disposal = await page.evaluate(() => window.vegetationDispose());
  assert.equal(r.disposal.sceneDisposed, true);
  assert.equal(r.disposal.engineScenes, 0);
  r.pageErrors = errors;
  r.externalRequests = external;
  r.failedRequests = failed;
  r.browser = await browser.version();
  r.renderer = 'Explicit SwiftShader: correctness only, not physical GPU';
  await fs.writeFile(
    'docs/evidence/a1-final/vegetation-browser.json',
    JSON.stringify(r, null, 2) + '\n',
  );
  console.log(JSON.stringify(r, null, 2));
} finally {
  await browser.close();
}
