import { describe, expect, test } from "bun:test";
import { parseMarkdown, visibleLength, type Block, type Inline } from "./markdown";

const t = (text: string): Inline => ({ type: "text", text });
const br: Inline = { type: "br" };
const p = (...children: Inline[]): Block => ({ type: "paragraph", children });
const bold = (...children: Inline[]): Inline => ({ type: "bold", children });
const italic = (...children: Inline[]): Inline => ({ type: "italic", children });

const cases: [string, string, Block[]][] = [
  ["plain", "hello pyon", [p(t("hello pyon"))]],
  ["newlines and blank lines", "one\ntwo\n\nthree", [p(t("one"), br, t("two"), br, br, t("three"))]],
  ["crlf", "one\r\ntwo\r\n", [p(t("one"), br, t("two"))]],
  ["bold", "**loud** noises", [p(bold(t("loud")), t(" noises"))]],
  ["italic star", "*soft*", [p(italic(t("soft")))]],
  ["italic underscore", "(_note_) ok", [p(t("("), italic(t("note")), t(") ok"))]],
  ["snake_case survives", "call snake_case_words now", [p(t("call snake_case_words now"))]],
  ["bold italic", "***both***", [p(italic(bold(t("both"))))]],
  ["bold inside italic", "*it **is** this*", [p(italic(t("it "), bold(t("is")), t(" this")))]],
  ["underline", "__under__", [p({ type: "underline", children: [t("under")] })]],
  ["strike", "~~gone~~ girl", [p({ type: "strike", children: [t("gone")] }, t(" girl"))]],
  ["mismatched star", "*mismatched markers", [p(t("*mismatched markers"))]],
  ["half-closed bold", "**half*", [p(t("*"), italic(t("half")))]],
  ["spoiler with bold", "||spoiler with **bold** inside||",
    [p({ type: "spoiler", children: [t("spoiler with "), bold(t("bold")), t(" inside")] })]],
  ["spoiler across lines", "||a\nb||", [p({ type: "spoiler", children: [t("a"), br, t("b")] })]],
  ["inline code is exempt", "run `**not** <@123>` now",
    [p(t("run "), { type: "code", text: "**not** <@123>" }, t(" now"))]],
  ["escapes", "\\*stars\\* and \\_under\\_", [p(t("*stars* and _under_"))]],
  ["code block with markdown inside", "```py\n# not a heading\n**nope**\n> nor a quote\n- nor a list\n```",
    [{ type: "codeblock", lang: "py", text: "# not a heading\n**nope**\n> nor a quote\n- nor a list" }]],
  ["code block between prose", "before\n```\nx = 1\n```\nafter",
    [p(t("before")), { type: "codeblock", lang: "", text: "x = 1" }, p(t("after"))]],
  ["code block mid-line", "look ```fence``` wow",
    [p(t("look ")), { type: "codeblock", lang: "", text: "fence" }, p(t(" wow"))]],
  ["unclosed fence stays literal", "```oops", [p(t("```oops"))]],
  ["ansi stripped", "```ansi\n\u001b[2;31mred\u001b[0m text\n```", [{ type: "codeblock", lang: "ansi", text: "red text" }]],
  ["quote lines", "> quoted\n> still\nafter",
    [{ type: "quote", children: [p(t("quoted"), br, t("still"))] }, p(t("after"))]],
  ["quote rest", "intro\n>>> all\nthe rest\n> literal",
    [p(t("intro")), { type: "quote", children: [p(t("all"), br, t("the rest"), br, t("> literal"))] }]],
  ["bold in quote", "> **bold** in quote", [{ type: "quote", children: [p(bold(t("bold")), t(" in quote"))] }]],
  ["blocks in quote", "> # big\n> -# tiny",
    [{ type: "quote", children: [{ type: "heading", level: 1, children: [t("big")] }, { type: "subtext", children: [t("tiny")] }] }]],
  ["no space no quote", ">nope", [p(t(">nope"))]],
  ["headings", "# big\n## mid\n### small\n#### nope\n#nospace", [
    { type: "heading", level: 1, children: [t("big")] },
    { type: "heading", level: 2, children: [t("mid")] },
    { type: "heading", level: 3, children: [t("small")] },
    p(t("#### nope"), br, t("#nospace")),
  ]],
  ["subtext", "real talk\n-# tiny **note**\n-#nospace",
    [p(t("real talk")), { type: "subtext", children: [t("tiny "), bold(t("note"))] }, p(t("-#nospace"))]],
  ["lists", "- one\n  - nested\n- two\n3. three\n4. four", [
    { type: "list", ordered: false, start: 1, items: [
      { children: [t("one")], list: { type: "list", ordered: false, start: 1, items: [{ children: [t("nested")] }] } },
      { children: [t("two")] },
    ] },
    { type: "list", ordered: true, start: 3, items: [{ children: [t("three")] }, { children: [t("four")] }] },
  ]],
  ["star list is not italic", "* item", [{ type: "list", ordered: false, start: 1, items: [{ children: [t("item")] }] }]],
  ["masked link", "read [the **docs**](https://example.com/a) pls",
    [p(t("read "), { type: "link", url: "https://example.com/a", children: [t("the "), bold(t("docs"))] }, t(" pls"))]],
  ["masked link, suppressed", "[x](<https://example.com>)", [p({ type: "link", url: "https://example.com", children: [t("x")] })]],
  ["suppressed url", "<https://example.com/q?a=1>", [p({ type: "url", url: "https://example.com/q?a=1", suppressed: true })]],
  ["bare url drops trailing dot", "see https://example.com/x.",
    [p(t("see "), { type: "url", url: "https://example.com/x", suppressed: false }, t("."))]],
  ["mentions", "<@80351110224678912> <@!80351110224678912> <@&165511591545143296> <#103735883630395392> <@$1402418491272986635>", [p(
    { type: "user", id: "80351110224678912" }, t(" "),
    { type: "user", id: "80351110224678912" }, t(" "),
    { type: "role", id: "165511591545143296" }, t(" "),
    { type: "channel", id: "103735883630395392" }, t(" "),
    { type: "game", id: "1402418491272986635" },
  )]],
  ["everyone and here", "@everyone hi @here, mail me@here.com",
    [p({ type: "everyone" }, t(" hi "), { type: "here" }, t(", mail me@here.com"))]],
  ["slash commands", "</airhorn:816437322781949972> </foo bar:1> </foo group bar:2>", [p(
    { type: "command", name: "airhorn", id: "816437322781949972" }, t(" "),
    { type: "command", name: "foo bar", id: "1" }, t(" "),
    { type: "command", name: "foo group bar", id: "2" },
  )]],
  ["guild navigation", "<id:customize><id:browse><id:guide><id:linked-roles><id:linked-roles:42><id:guide:42>", [p(
    { type: "nav", nav: "customize" },
    { type: "nav", nav: "browse" },
    { type: "nav", nav: "guide" },
    { type: "nav", nav: "linked-roles" },
    { type: "nav", nav: "linked-roles", role: "42" },
    t("<id:guide:42>"),
  )]],
  ["timestamps", "<t:1618953630> <t:1618953630:S> <t:-1:R> <t:1:x>", [p(
    { type: "time", unix: 1618953630, style: "f" }, t(" "),
    { type: "time", unix: 1618953630, style: "S" }, t(" "),
    { type: "time", unix: -1, style: "R" },
    t(" <t:1:x>"),
  )]],
  ["custom emoji mid-sentence", "gg <a:b1nzy:392938283556143104> wp", [p(
    t("gg "), { type: "emoji", name: "b1nzy", id: "392938283556143104", animated: true }, t(" wp"),
  )]],
  ["only three custom emoji", "<a:pepe_dance:123456789012345678><:kek:1><:kek:2>", [p(
    { type: "emoji", name: "pepe_dance", id: "123456789012345678", animated: true },
    { type: "emoji", name: "kek", id: "1", animated: false },
    { type: "emoji", name: "kek", id: "2", animated: false },
  )]],
  ["unicode emoji pass through", "🪴 pyon 👨‍👩‍👧", [p(t("🪴 pyon 👨‍👩‍👧"))]],
  ["empty", "  \n ", []],
];

describe("parseMarkdown", () => {
  test.each(cases)("%s", (_, input, expected) => {
    expect(parseMarkdown(input)).toEqual(expected);
  });

  test("every timestamp style", () => {
    for (const style of ["t", "T", "d", "D", "f", "F", "s", "S", "R"])
      expect(parseMarkdown(`<t:0:${style}>`)).toEqual([p({ type: "time", unix: 0, style } as Inline)]);
  });
});

describe("visibleLength", () => {
  const len = (s: string) => visibleLength(parseMarkdown(s));

  test("custom emoji count as two", () => {
    expect(len("<a:pepe_dance:123456789012345678>")).toBe(2);
    expect(len("<a:pepe_dance:123456789012345678><:kek:1><:kek:2>")).toBe(6);
  });
  test("markup is free", () => expect(len("**hi** __there__")).toBe(8));
  test("unicode emoji count as two, zwj and all", () => expect(len("🪴👨‍👩‍👧")).toBe(4));
  test("line breaks count like raw text", () => expect(len("line\nbreak")).toBe("line\nbreak".length));
  test("blocks sit on their own lines", () => expect(len("# title\nbody")).toBe(10));
  test("quote markers vanish", () => expect(len("> abc\n> de")).toBe(6));
  test("list markers count", () => expect(len("- ab\n- cd")).toBe(9));
  test("spoilers keep their width", () => expect(len("||secret||")).toBe(6));
  test("links count their label, not the url", () => expect(len("[docs](https://example.com/very/long)")).toBe(4));
  test("timestamps use the reference example width", () => expect(len("<t:1618953630:R>")).toBe(11));
  test("slash command and nav labels", () => {
    expect(len("</foo bar:1>")).toBe(8);
    expect(len("<id:browse>")).toBe(15);
  });
  test("empty", () => expect(len("")).toBe(0));
});
