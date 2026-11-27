/* eslint-disable @typescript-eslint/no-require-imports -- Assimp WASM toolchain exposes a CommonJS factory. */
/* global require, console, process, Buffer */
const fs = require('fs');
require(process.cwd() + '/.cache/g2/tools/node_modules/assimpjs')().then(
  (a) => {
    for (const name of process.argv.slice(2)) {
      const f = new a.FileList();
      f.AddFile(
        name,
        new Uint8Array(fs.readFileSync('.cache/g2/rocketbox/' + name)),
      );
      const r = a.ConvertFileList(f, 'gltf2');
      if (!r.IsSuccess()) throw Error(r.GetErrorCode());
      for (let i = 0; i < r.FileCount(); i++) {
        const out = r.GetFile(i);
        fs.writeFileSync(
          '.cache/g2/' + name + '.' + out.GetPath(),
          Buffer.from(out.GetContent()),
        );
      }
      console.log(name, r.FileCount());
    }
  },
);
