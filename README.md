# Issue Labeler
This action automatically add "done" label to issues when related PR is merged.

## PR Description
To trigger this action, at least one line in PR description should match following regex:

```regex
/^bug:\s*((?:\[#\d+\]\([^)]+\)|#\d+)[,\s]*)+$/
```

This regex supports both simple issue references and markdown link format:
- Simple format: `bug: #123` or `bug: #123, #456`
- Markdown link format: `bug: [#123](https://github.com/owner/repo/issues/123)`
- Mixed format: `bug: #123, [#456](https://github.com/owner/repo/issues/456)`

## Tips
If the PR contributes to a bug, but does not fully resolve it, add any none whitespace content to prevent match. E.g.
```
bug: #1234 in progress
```

or
```
bug: #1234 WIP
```
