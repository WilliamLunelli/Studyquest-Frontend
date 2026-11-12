import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

export function loadTypeScript(file, stubs = {}, globals = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({
    module, exports: module.exports, Request, Response, URL,
    require(name) {
      if (name in stubs) return stubs[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  vm.runInContext(outputText, context, { filename: file });
  return module.exports;
}
