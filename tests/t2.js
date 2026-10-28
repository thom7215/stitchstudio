const F=require('../src/formats.js'); const fs=require('fs');
const A=JSON.parse(fs.readFileSync('out.json'));
fs.writeFileSync('d.pes',F.writePES(A,'test')); fs.writeFileSync('d.dst',F.writeDST(A,'test'));
fs.writeFileSync('d.exp',F.writeEXP(A)); fs.writeFileSync('d.jef',F.writeJEF(A));
fs.writeFileSync('d.zip',F.zip([{name:'d.pes',data:F.writePES(A,'test')},{name:'d.dst',data:F.writeDST(A,'t')}]));
console.log('points',A.X.length,'stitches',A.stitches,'colors',A.colors.length);
