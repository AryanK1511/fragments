# Users should be able to create a JSON fragment

POST http://localhost:8080/v1/fragments
Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Hello S3!`

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9

[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: text/plain
Content-Length: 9

[Asserts]
body == "Hello S3!"

# 3. Try to DELETE the fragment we just posted by its URL
DELETE {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 201
Content-Type: application/json; charset=utf-8
Content-Length: 15

[Asserts]
jsonpath "$.status" == "ok"

# 4. Try to GET the fragment we just deleted
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 404
Content-Type: application/json; charset=utf-8
Content-Length: 89

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "The requested fragment doesn't exist."
