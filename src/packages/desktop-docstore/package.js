Package.describe({
  summary: "Store for documents",
  internal: false
});

Package.on_use(function (api) {
  api.use('desktop-contentstore');
  
  api.export('DocStore');
  api.export('mime');

  api.add_files('desktop-docstore.js', 'server');
  api.add_files('desktop-docstore-client.js', 'client');

  api.add_files('mimetypes.txt', 'server');

  api.add_files('desktop-mimetypes-common.js', 'server');
  api.add_files('desktop-mimetypes-common.js', 'client');

  api.add_files('desktop-mimetypes.js', 'server');
  api.add_files('desktop-mimetypes-client.js', 'client');

});
