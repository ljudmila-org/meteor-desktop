Package.describe({
  summary: "Store for documents",
  internal: false
});

Package.on_use(function (api) {
  api.imply('contentstore-hashfile');
  api.export('DocStore');
  api.add_files('desktop-docstore.js', 'server');
  api.add_files('desktop-docstore-client.js', 'client');
});
