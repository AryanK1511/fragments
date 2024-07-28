# 1. Try to create a Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown

[BasicAuth]
user1@email.com:password1

`**This is a markdown fragment**`

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 31

[Captures]
url: header "Location"

# 2. Try to get the data for the markdown fragment that we just created
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
body == "**This is a markdown fragment**"

# 2. Try to convert the markdown fragment that we just created into HTML
GET {{url}}.html

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
body == "<p><strong>This is a markdown fragment</strong></p>\n"
