##ContentStore

Stores arbitrary content in hashed directories in the file system, avoiding duplication.

###Synopsis
    ContentStore.write(['userdocs',title],content);
    var data = ContentStore.read('example.png');
    ContentStore.remove({any:'thing',can:'be',an:'address'};

###API
####`ContentStore.write(address,content)`
Save the content, add a reference to it. Returns the ContentStore record, the most interesting fields being `.size` and `.content_encoding`.

`address` can be any JSONable object that uniquely identifies this reference.
`content` can be a string, a JSONable object or Uint8Array.

####`ContentStore.read(address)`
Returns the content record, with `.content` holding the retrieved content.

####`ContentStore.remove(address)`
Removes the reference to the content, and removes the content itself if no references are left.
