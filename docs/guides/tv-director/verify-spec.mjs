#!/usr/bin/env node
/**
 * Why: coverage must be reproducible without pretending that planned cases
 * are passing product tests. Read-only: no credentials, network or model calls.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const read = name => fs.readFileSync(path.join(directory, name), "utf8");
const map = JSON.parse(read("implementation-map.json"));
const inventory = JSON.parse(read("source-inventory.json"));
const docs = {
  feature: read("feature-contracts.md"), skill: read("skill-contracts.md"),
  workflow: read("workflow-contracts.md"), acceptance: read("acceptance-contracts.md"),
};
const ids = (text, pattern) => [...text.matchAll(pattern)].map(match => match[1]);
const expected = {
  requirements: ids(docs.feature, /^\| ([AODEQSRKXC]\d{2})(?:\s+[^|]+)? \|/gm),
  methods: ids(docs.skill, /^### (M\d{2}) /gm),
  rules: ids(docs.skill, /^\| (G\d{2}) \|/gm),
  transitions: ids(docs.workflow, /^\| (WT\d{2}) \|/gm),
  fixtures: ids(docs.acceptance, /^\| (F\d{2}) \|/gm),
  qualityGroups: ids(docs.acceptance, /^\| (B\d{2}) \|/gm),
  sourceChecks: ids(docs.acceptance, /^\| (N\d{2}) \|/gm),
};
const groups = { A: 26, O: 16, D: 9, Q: 9, S: 7, E: 32, R: 18, K: 20, X: 12, C: 8 };
const fixedIds = Object.entries(groups).flatMap(([prefix, count]) =>
  Array.from({ length: count }, (_, i) => prefix + String(i + 1).padStart(2, "0")));
const nonempty = value => typeof value === "string" && value.trim().length > 0;
const repoFile = p => typeof p === "string" && !path.isAbsolute(p) &&
  !p.split("/").includes("..") && fs.existsSync(path.join(root, p)) &&
  fs.statSync(path.join(root, p)).isFile();
const safePlanPath = p => typeof p === "string" &&
  /^(src\/novelvideo\/director\/|frontend\/src\/features\/director\/|frontend\/src\/__tests__\/|tests\/)/.test(p) &&
  !p.includes("..") && !p.includes("*") && !p.endsWith("/") && !p.includes("undefined");

function validate(candidate, source) {
  const errors = [];
  const check = (ok, reason) => { if (!ok) errors.push(reason); };
  const indexes = {};
  for (const name of ["requirements", "methods", "rules", "transitions", "fixtures", "tests",
    "commands", "transports", "schemas", "differences", "qualityGroups", "sourceChecks"]) {
    const entries = candidate[name];
    check(Array.isArray(entries) && entries.length > 0, name + ": missing list");
    indexes[name] = new Map();
    for (const entry of entries ?? []) {
      check(nonempty(entry.id), name + ": empty id");
      check(!indexes[name].has(entry.id), name + ": duplicate " + entry.id);
      indexes[name].set(entry.id, entry);
    }
  }
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  check(sameSet(expected.requirements, fixedIds), "Markdown action/capability denominator changed");
  for (const [name, wanted] of Object.entries(expected))
    check(sameSet([...indexes[name].keys()], wanted), name + ": Markdown/index ID mismatch");
  const counts = { actions: 149, capabilities: 8, methods: 24, rules: 18, transitions: 33,
    fixtures: 33, qualityGroups: 12, sourceChecks: 10 };
  for (const [key, value] of Object.entries(counts))
    check(candidate.counts[key] === value, "Wrong denominator: " + key);
  check(candidate.requirements.filter(x => x.kind === "action").length === 149, "149 actions required");
  check(candidate.requirements.filter(x => x.kind === "capability").length === 8, "8 capabilities required");
  const references = (owner, name, values, allowEmpty = false) => {
    check(Array.isArray(values) && (allowEmpty || values.length > 0), owner + ": empty " + name);
    for (const id of values ?? []) check(indexes[name].has(id), owner + ": unknown " + name + "/" + id);
  };
  const resultStatus = entry => {
    if (entry.status === undefined) return;
    check(["not_implemented", "implemented_unverified", "pass", "fail", "blocked",
      "planned_not_executable", "not_run"].includes(entry.status), entry.id + ": invalid status");
    if (entry.status === "pass") {
      check(repoFile(entry.resultRef), entry.id + ": PASS needs real result file");
      check(entry.evidenceKind === "product_execution", entry.id + ": spec check is not product PASS");
    }
  };
  for (const entry of candidate.requirements) {
    check(repoFile(entry.contractRef), entry.id + ": broken contract");
    check(safePlanPath(entry.componentPath), entry.id + ": unsafe/unspecified component");
    check(entry.useCasePaths?.length > 0 && entry.useCasePaths.every(safePlanPath), entry.id + ": missing use-case path");
    check(entry.designStatus === "ready", entry.id + ": design not resolved");
    check(/^P[0-8]$/.test(entry.stage), entry.id + ": invalid phase");
    references(entry.id, "commands", entry.commands);
    references(entry.id, "transports", entry.transportIds);
    references(entry.id, "schemas", entry.schemaRefs);
    references(entry.id, "methods", entry.methodIds, true);
    check(nonempty(entry.methodBindingPolicy), entry.id + ": method policy missing");
    references(entry.id, "rules", entry.ruleIds);
    references(entry.id, "fixtures", entry.fixtureIds);
    references(entry.id, "tests", entry.testIds);
    references(entry.id, "differences", entry.differenceIds, true);
    check(entry.testIds?.length >= 2, entry.id + ": positive and negative required");
    check(entry.evidenceRefs?.length > 0 && entry.evidenceRefs.every(repoFile), entry.id + ": evidence path missing");
    for (const commandId of entry.commands ?? []) {
      const cmd = indexes.commands.get(commandId);
      if (!cmd) continue;
      check(cmd.requirementIds.includes(entry.id), entry.id + ": command inverse missing");
      check(entry.transportIds.includes(cmd.transportId), entry.id + ": command transport omitted");
      check(entry.schemaRefs.includes(cmd.inputSchema) && entry.schemaRefs.includes(cmd.outputSchema),
        entry.id + ": input/output schema omitted");
    }
    resultStatus(entry);
  }
  for (const method of candidate.methods) {
    check(repoFile(method.contractRef), method.id + ": contract missing");
    check(safePlanPath(method.packagePath) && safePlanPath(method.useCasePath), method.id + ": missing package/code path");
    check(method.requiredFiles.length === 7, method.id + ": incomplete method package");
    check(nonempty(method.inputContract) && nonempty(method.outputContract), method.id + ": input/output missing");
    references(method.id, "fixtures", method.fixtureIds);
    references(method.id, "tests", method.testIds);
    check(method.testIds.includes("METHOD-" + method.id + "-positive") &&
      method.testIds.includes("METHOD-" + method.id + "-negative"), method.id + ": missing polarity");
    check(method.sourceRefs.length > 0 && method.sourceRefs.every(p => source.files.some(f => f.path === p)),
      method.id + ": missing frozen source");
    resultStatus(method);
  }
  for (const rule of candidate.rules) {
    check(nonempty(rule.sourceAndTrigger) && nonempty(rule.behavior) && nonempty(rule.disableOrConflict),
      rule.id + ": trigger/disable/conflict missing");
    check(safePlanPath(rule.validatorPath), rule.id + ": validator path missing");
    references(rule.id, "tests", rule.testIds);
    for (const suffix of ["enabled", "disabled", "conflict"])
      check(rule.testIds.includes("RULE-" + rule.id + "-" + suffix), rule.id + ": missing " + suffix);
    check(rule.sourceRefs.every(p => source.files.some(f => f.path === p)), rule.id + ": source missing");
    resultStatus(rule);
  }
  for (const state of candidate.transitions) {
    check([state.from, state.event, state.guard, state.to].every(nonempty), state.id + ": incomplete transition");
    check(safePlanPath(state.useCasePath), state.id + ": code path missing");
    references(state.id, "tests", state.testIds);
    for (const suffix of ["allowed", "guard_rejected"])
      check(state.testIds.includes("STATE-" + state.id + "-" + suffix), state.id + ": missing " + suffix);
    resultStatus(state);
  }
  for (const fixture of candidate.fixtures) {
    check([fixture.input, fixture.expected].every(nonempty), fixture.id + ": empty fixture contract");
    check(safePlanPath(fixture.plannedPath), fixture.id + ": fixture path missing");
    check(["positive", "negative"].every(p => fixture.variants.includes(p)), fixture.id + ": fixture polarity");
    check(candidate.requirements.some(r => r.fixtureIds.includes(fixture.id)) ||
      candidate.methods.some(m => m.fixtureIds.includes(fixture.id)), fixture.id + ": unreferenced fixture");
    resultStatus(fixture);
  }
  for (const test of candidate.tests) {
    check(nonempty(test.scenario) && safePlanPath(test.plannedPath), test.id + ": planned test incomplete");
    references(test.id, "fixtures", test.fixtureIds, true);
    check(["not_run", "pass", "fail", "blocked"].includes(test.executionStatus), test.id + ": invalid execution status");
    if (test.executionStatus === "pass") check(repoFile(test.resultRef), test.id + ": fake test PASS");
    check(["requirements", "methods", "rules", "transitions"].some(name =>
      indexes[name].get(test.ownerId)?.testIds.includes(test.id)), test.id + ": orphan test");
  }
  for (const command of candidate.commands) {
    references(command.id, "transports", [command.transportId]);
    references(command.id, "schemas", [command.inputSchema, command.outputSchema]);
    references(command.id, "requirements", command.requirementIds);
    check(Array.isArray(command.requiredFields), command.id + ": required field list missing");
    const input = indexes.schemas.get(command.inputSchema);
    for (const field of command.requiredFields ?? [])
      check(new RegExp("(?:^|; )" + field + "\\??:").test(input?.shape ?? ""), command.id + ": unknown required field " + field);
    for (const branch of command.conditionalFields ?? []) {
      for (const field of [...Object.keys(branch.when), ...branch.require, ...branch.forbid])
        check((input?.shape ?? "").split("; ").some(part => part.startsWith(field + ":") || part.startsWith(field + "?:")), command.id + ": unknown conditional field " + field);
      check(!branch.require.some(field => branch.forbid.includes(field)), command.id + ": contradictory variant");
    }
    check(command.validationRefs?.length === command.requirementIds.length, command.id + ": constraint missing");
    check(nonempty(command.validationPolicy) && nonempty(command.costPolicy), command.id + ": boundary/fee missing");
    for (const id of command.requirementIds)
      check(indexes.requirements.get(id)?.commands.includes(command.id), command.id + ": inverse mismatch");
  }
  for (const api of candidate.transports) {
    check(["local", "GET", "POST"].includes(api.method) && nonempty(api.route), api.id + ": route invalid");
    references(api.id, "schemas", [api.inputSchema, api.outputSchema]);
    check(candidate.commands.some(c => c.transportId === api.id), api.id + ": unused endpoint");
    check(api.method === "local" || api.route.startsWith("/projects/{project}/director/v2/"), api.id + ": unversioned route");
  }
  for (const schema of candidate.schemas) {
    check(nonempty(schema.shape) && repoFile(schema.definitionRef), schema.id + ": schema missing");
    check(schema.additionalProperties === false, schema.id + ": permissive payload");
  }
  check(source.files.length === 24, "source inventory must include all 24 frozen files");
  const sourcePaths = new Set();
  for (const file of source.files) {
    check(!sourcePaths.has(file.path), "duplicate source file " + file.path);
    sourcePaths.add(file.path);
    check(/^[a-f0-9]{64}$/.test(file.sha256), "invalid source hash " + file.path);
    check(!path.isAbsolute(file.path) && !file.path.includes(".."), "unsafe source path");
    check(file.originMatch === true, "source copies differ: " + file.path);
    check(nonempty(file.disposition), "source disposition missing");
  }
  check(source.knowledge.ruleCount === 0 && source.knowledge.exemplarCount === 0, "fabricated knowledge");
  check(candidate.sourceRoutes.length === 15, "missing short-drama route");
  for (const route of candidate.sourceRoutes) {
    check(sourcePaths.has(route.sourceRef), route.sourceCommand + ": no source");
    references(route.sourceCommand, "methods", route.methodIds);
    references(route.sourceCommand, "fixtures", route.fixtureIds);
    check(nonempty(route.policy), route.sourceCommand + ": routing policy missing");
  }
  check(candidate.differences.length === 13, "difference register incomplete");
  for (const diff of candidate.differences) {
    check(diff.designStatus === "decided" && [diff.decision, diff.owner, diff.releaseGate].every(nonempty),
      diff.id + ": unresolved/ownerless decision");
    check(diff.sourceParity === "not_claimed", diff.id + ": unknown source became parity");
    references(diff.id, "methods", diff.methodIds);
    references(diff.id, "fixtures", diff.fixtureIds);
  }
  check(candidate.baseline.existingPaths.every(repoFile), "baseline path missing");
  for (const quality of candidate.qualityGroups)
    check(quality.runsPerSide === 2, quality.id + ": quality denominator weakened");
  return errors;
}

function checkDocuments() {
  const errors = [];
  const files = ["../tv-director-skill-fusion.md", "../liblib-tv-director-development.md",
    "feature-contracts.md", "skill-contracts.md", "workflow-contracts.md",
    "document-semantics.md", "acceptance-contracts.md", "implementation-closure.md"];
  for (const file of files) {
    const full = path.resolve(directory, file), value = fs.readFileSync(full, "utf8");
    const fencePattern = new RegExp("^" + String.fromCharCode(96).repeat(3), "gm");
    if ((value.match(fencePattern) ?? []).length % 2) errors.push(file + ": unclosed fence");
    if (/[ \t]+$/m.test(value)) errors.push(file + ": trailing whitespace");
    for (const match of value.matchAll(/\[[^\]]+\]\(([^)\n]+)\)/g)) {
      const href = match[1].split("#")[0];
      if (!href || /^(https?:|mailto:)/.test(href)) continue;
      if (!fs.existsSync(path.resolve(path.dirname(full), href))) errors.push(file + ": broken link " + href);
    }
    if (value.includes("/Users/") || /"(?:usertoken|access_token|refresh_token)"\s*:\s*"[^"]+"/.test(value))
      errors.push(file + ": potential credential/machine-path content");
  }
  return errors;
}

const errors = [...validate(map, inventory), ...checkDocuments()];
if (errors.length) {
  console.error(JSON.stringify({ kind: "specification", status: "FAIL", errors }, null, 2));
  process.exit(1);
}
let negativeCases = 0;
if (process.argv.includes("--self-test")) {
  const mutations = [
    ["missing button", m => m.requirements.splice(0, 1)],
    ["duplicate button", m => m.requirements.push(m.requirements[0])],
    ["dangling command", m => m.requirements[0].commands.push("unregistered")],
    ["wrong required parameter", m => m.commands[0].requiredFields.push("secretUnknownField")],
    ["missing input schema", m => m.schemas.splice(0, 1)],
    ["missing fixture", m => m.fixtures.pop()],
    ["missing transition", m => m.transitions.pop()],
    ["missing rule polarity", m => m.rules[0].testIds.pop()],
    ["missing method negative", m => m.methods[0].testIds.pop()],
    ["fake product pass", m => { m.requirements[0].status = "pass"; m.requirements[0].resultRef = null; }],
    ["fake test pass", m => { m.tests[0].executionStatus = "pass"; m.tests[0].resultRef = null; }],
    ["unsafe planned path", m => m.requirements[0].componentPath = "/tmp/anything.tsx"],
    ["wrong denominator", m => m.counts.actions = 148],
    ["unresolved difference", m => m.differences[0].designStatus = "later"],
    ["orphan use case", m => m.requirements[0].useCasePaths = []],
    ["missing source route", m => m.sourceRoutes.pop()],
    ["invented source hash", (_m, s) => s.files[0].sha256 = "invented"],
    ["invented knowledge", (_m, s) => s.knowledge.ruleCount = 100],
    ["input source drift", (_m, s) => s.files[0].originMatch = false],
    ["unversioned endpoint", m => m.transports.find(t => t.method !== "local").route = "/legacy"],
    ["permissive schema", m => m.schemas[0].additionalProperties = true],
    ["weakened quality sample", m => m.qualityGroups[0].runsPerSide = 1],
  ];
  for (const [name, mutate] of mutations) {
    const candidate = structuredClone(map), source = structuredClone(inventory);
    mutate(candidate, source);
    if (!validate(candidate, source).length) throw new Error("Self-test escaped: " + name);
    negativeCases++;
  }
}
console.log(JSON.stringify({
  kind: "specification_only", status: "PASS", counts: map.counts,
  commands: map.commands.length, plannedTests: map.tests.length,
  sourceFiles: inventory.files.length, negativeMutationsRejected: negativeCases,
  productTestsExecuted: 0, providerCalls: 0,
  note: "索引和文档检查通过，不代表482个计划用例或产品功能通过。"
}, null, 2));
