import core from "@actions/core";
import fs from "fs";
import fsasync from "fs/promises";
import path from "path";
import { set } from "lodash";
import { globSync } from "glob";

// determine whether the provided path points to a file or a directory that exists
const checkPath = (path) => {
  try {
    const info = fs.statSync(path);

    switch (true) {
      case info.isDirectory():
        return "directory";
      case info.isFile():
        return "file";
      default:
        return "unknown";
    }
  } catch (error) {
    return "unknown";
  }
};

const doReplace = (file, prefix, omitSuffix) => {
  switch (path.extname(file)) {
    case ".json":
      doReplaceJson(file);
      break;
    default:
      doReplaceTxt(file, prefix, omitSuffix);
  }
};

let paths = [];
// get an array containing all the json paths in the specified object
const getPaths = (object, previousPath) => {
  for (const key in object) {
    const currentPath = previousPath ? `${previousPath}.${key}` : key;

    if (Array.isArray(object[key])) {
      paths.push(currentPath);
      getPaths(object[key], currentPath);
    } else if (typeof object[key] === "object") {
      if (!Array.isArray(object)) {
        paths.push(currentPath);
      }
      getPaths(object[key], currentPath);
    } else {
      paths.push(currentPath);
    }
  }
};

// replace the values of the json key/value pair with matching
// values from the env variables
// env variable case must match the json key case
const doReplaceJson = async (file) => {
  const fileContents = await fsasync.readFile(file, "utf-8");
  const json = JSON.parse(fileContents);

  paths = [];
  getPaths(json);
    core.info(`zjson ${json}`);
  paths.forEach((path) => {
    // does the variable exist in the env?
    const env = process.env[path] || "not found";
      core.info(`zenv ${env}`);
    if (env !== "not found") {
      core.info(`Replacing placeholder for ${path}`);
      set(json, path, env);
    }
  });

  await fsasync.writeFile(file, JSON.stringify(json));
  core.info("File saved");
};

// replace the placeholders with matching values from the env variables
// env variables must be all uppercase, placeholder case is unimportant
const doReplaceTxt = async (file, prefix, omitSuffix) => {
  const pattern = `${prefix}{.+}${prefix}`;
  const checkPattern = `${prefix}{.+)}${prefix}`;

  if (omitSuffix === true) {
    pattern = `${prefix}{\\w+}`;
    checkPattern = `${prefix}{(\\w+)}`;
    core.info("omitting suffix");
  }

  const regExp = new RegExp(pattern, "gi");
  const check = new RegExp(checkPattern, "i");
  const fileContents = await fsasync.readFile(file, "utf-8");

  const result = fileContents.replace(regExp, (placeholder) => {
    // we've found a placeholder, now extract the variable name
    const varName = placeholder.match(check)[1];

    // does the variable exist in the env?
    const env = process.env[varName.toUpperCase()];

    if (typeof env === "undefined") {
      core.warning(`Value missing for ${varName}`);

      return placeholder;
    } else {
      core.info(`Replacing placeholder ${placeholder}`);
    }

    // we're all good, return the value to use as the replacement
    return env;
  });

  await fsasync.writeFile(file, result);
  core.info("File saved");
};

// main part of code
try {
  const pathList = core.getInput("files");
  const prefix = core.getInput("prefix");
  const omitSuffix = core.getInput("omit-suffix");
  let paths;

  if (pathList.includes("*")) {
    paths = globSync(pathList, { ignore: "node_modules/**" });
  } else {
    paths = pathList.split("\n");
  }

  paths.forEach(async (path) => {
    if (path.length > 0) {
      const pathType = checkPath(path);

      switch (pathType) {
        case "file":
          doReplace(path, prefix, omitSuffix);
          break;
        case "directory":
          const files = await fsasync.readdir(path);
          files.forEach((file) => doReplace(file, prefix, omitSuffix));
          break;
        default:
          throw new Error(`invalid or missing path/file: ${path}`);
      }
    }
  });
} catch (error) {
  core.setFailed(error.message);
}
