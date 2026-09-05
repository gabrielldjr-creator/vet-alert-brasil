/* eslint-disable @typescript-eslint/no-require-imports -- preload must run as CommonJS before tsx */
const os = require("node:os");

os.homedir = () => process.cwd();
os.userInfo = () => ({
  uid: -1,
  gid: -1,
  username: "codex",
  homedir: process.cwd(),
  shell: null,
});
