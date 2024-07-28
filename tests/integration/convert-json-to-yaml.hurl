# 1. Try to create a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json

[BasicAuth]
user1@email.com:password1

{
  "key": "value"
}

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 20

[Captures]
url: header "Location"

# 2. Try to get the data for the JSON fragment that we just created
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
jsonpath "$.key" == "value"

# 2. Try to convert the JSON fragment to YAML
GET {{url}}.yaml

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
body == "key: value\n"
