# 1. Try to create a PNG
POST http://localhost:8080/v1/fragments
Content-Type: image/png

[BasicAuth]
user1@email.com:password1

file, file.png;

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "image/png"
jsonpath "$.fragment.size" == 1420959

[Captures]
url: header "Location"

# 2. Try to get the data for the PNG fragment that we just created
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
header "Content-Type" == "image/png"
header "Content-Length" == "1420959"
file, file.png;

# 2. Try to convert the PNG fragment that we just created into a JPEG fragment
GET {{url}}.jpg

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
header "Content-Type" == "image/jpeg"
header "Content-Length" == "176889"
