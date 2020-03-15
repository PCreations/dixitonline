const { execSync } = require("child_process");

const packageName = process.argv[2];

execSync(
  `rsync -av --progress __scaffoldedPackage__/ packages/${packageName} --exclude node_modules --exclude build`
);
execSync(
  `json -I -f packages/${packageName}/package.json -e "this.name='${packageName}'"`
);
execSync(
  `json -I -f packages/${packageName}/package.json -e "this.scripts['hoist-build']='rm -rf ../../functions/builds/${packageName} && cp -R build ../../functions/builds/${packageName}'"`
);
execSync(`cd packages/${packageName} && yarn`);
