# 1. Try to create a JPEG
POST http://localhost:8080/v1/fragments
Content-Type: image/jpeg

[BasicAuth]
user1@email.com:password1

file, file.jpeg;

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "image/jpeg"
jsonpath "$.fragment.size" == 2630499

[Captures]
url: header "Location"

# 2. Try to get the data for the JPEG fragment that we just created
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
header "Content-Type" == "image/jpeg"
header "Content-Length" == "2630499"
file, file.jpeg;

# 2. Try to convert the JPEG fragment that we just created into a PNG fragment
GET {{url}}.png

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
header "Content-Type" == "image/png"
header "Content-Length" == "25317226"
