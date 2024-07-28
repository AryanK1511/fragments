# Users should be able to create a YAML fragment

POST http://localhost:8080/v1/fragments
Content-Type: application/yaml

[BasicAuth]
user1@email.com:password1

file, file.yaml;

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/yaml"
jsonpath "$.fragment.size" == 29

[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/yaml
Content-Length: 29

[Asserts]
file, file.yaml;
