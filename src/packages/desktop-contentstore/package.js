Package.describe({
  summary: "Store content in the file system",
  internal: false
});
Npm.depends({
  wrench: '1.5.1'
})

Package.on_use(function (api) {
  api.export('ContentStore');
  api.add_files('contentstore-hashfile.js', 'server');
});
