# Replace environment variables in files

## Inputs

- `files`
  - Path to a file with the placeholders, multiple files, or a directory. If using a directory, all files in the directory will be processed. Glob patterns may be used.
- `prefix`
  - Placeholder prefix/suffix. All placeholders are assumed to be contained within `{ }`, with an additional prefix/suffix, e.g. `#{myVar}#`, `${myVar}$`. In these cases, the prefix value would be `#` or `$` respectively.
  - Optional, defaults to `#`
- `omit-suffix`
  - Only use a prefix for the placeholder, do not include a suffix, e.g. `#{myVar}`. Leave this at false for any placeholder containing punctuation, otherwise the placeholder will not be correctly identified.
  - Optional, defaults to `false`

## Notes

For JSON files, the keys being passed in must reflect the casing of the JSON path that needs to be updated.

For other files, values to replace the placeholders must have the same name as the placeholder, but in UPPERCASE. The casing of the placeholders themselves is not important. Hyphens should not be used, instead, use underscores.

## Example usage

The workflow for a non-JSON file:

```yaml
name: My actions
uses: /sainsburys-tech/eo-gitaction-replace@v2
env:
  SPECIALFILEPATH: "whatever"
  SOMETHING_ELSE: "something special"
with:
  files: path/to/a/file.txt
```

The `file`:

```yaml
env:
  path: #{specialFilePath}#,
  other: #{something_else}#
```

The result:

```yaml
env:
  path: whatever
  other: something special
```

The workflow for a JSON file:

```yaml
name: My actions
uses: /sainsburys-tech/eo-gitaction-replace@v2
env:
  AksSettings.Replicas: 3
  MongoDbSettings.DatabaseName: MyShinyDb
  SomethingElse: wibble
with:
  files: path/to/a/file.json
```

The `file`:

```json
{
  "AksSettings": {
    "Replicas": "*"
  },
  "MongoDbSettings": {
    "DatabaseName": "*"
  },
  "SomethingElse": "*"
}
```

The result:

```json
{
  "AksSettings": {
    "Replicas": "3"
  },
  "MongoDbSettings": {
    "DatabaseName": "MyShinyDb"
  },
  "SomethingElse": "wibble"
}
```

`files` can be any combination of yaml/JSON files. The `env` values must reflect the files being passed in, e.g:

```yaml
env:
  PLACEHOLDER_IN_TEXT_FILE: some value
  PlaceHolder.In.Json.File: some other value
```

`files` can also be specified as follows:

```yaml
with:
  files: |-
    fileone.yml
    filetwo.json
    Dockerfile
```

```yaml
with:
  files: path/to/a/directory
```

```yaml
with:
  files: "dist/**/*.js"
```

## Note For Developers

If you make any changes to replace/index.js, you will need to recompile the code for it to work as a called action.

Execute the following from the folder containing `packages.json`

```js
npm i -g @vercel/ncc
ncc build index.js --license licenses.txt
```
