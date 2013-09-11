Package.describe({
  summary: "Desktop Directory Provider",
  internal: false
});

Package.on_use(function (api) {
  api.export('Root');
  api.add_files('DirectoryProvider.common.js', 'server');
  api.add_files('DirectoryProvider.js', 'server');
  api.add_files('Root.server.js', 'server');

  api.add_files('DirectoryProvider.common.js', 'client');
  api.add_files('Root.client.js', 'client');
});
