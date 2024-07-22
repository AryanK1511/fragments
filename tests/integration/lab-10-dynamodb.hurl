# 1. Try to create a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json

[BasicAuth]
user1@email.com:password1

{ 
  "service": "DynamoDB"
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
jsonpath "$.fragment.size" == 28

[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"
fragment1_ownerId: jsonpath "$.fragment.ownerId"
fragment1_created: jsonpath "$.fragment.created"
fragment1_updated: jsonpath "$.fragment.updated"

# 2. Try to GET the metadata for the JSON fragment we just posted
GET {{fragment1_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/json; charset=utf-8
Content-Length: 259

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.ownerId" == "{{fragment1_ownerId}}"
jsonpath "$.fragment.created" == "{{fragment1_created}}"
jsonpath "$.fragment.updated" == "{{fragment1_updated}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 28

# 3. Try to create a Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown

[BasicAuth]
user1@email.com:password1

`DynamoDB is **great**.`

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"
fragment2_ownerId: jsonpath "$.fragment.ownerId"
fragment2_created: jsonpath "$.fragment.created"
fragment2_updated: jsonpath "$.fragment.updated"

# 4. Try to GET the metadata for the markdown fragment we just posted
GET {{fragment2_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/json; charset=utf-8
Content-Length: 256

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.ownerId" == "{{fragment2_ownerId}}"
jsonpath "$.fragment.created" == "{{fragment2_created}}"
jsonpath "$.fragment.updated" == "{{fragment2_updated}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# 5. Try to GET all of the fragments for the same authorized user without expanding them
GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# Check if the fragments key is a list
jsonpath "$.fragments" isCollection

# Verify that the fragments list contains the IDs stored in variables fragment1_id and fragment2_id
jsonpath "$.fragments" includes "{{fragment1_id}}"
jsonpath "$.fragments" includes "{{fragment2_id}}"

# 6. DELETE the first fragment we created above
DELETE http://localhost:8080/v1/fragments/{{fragment1_id}}

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# 7. Try to GET the first fragment again using the url you captured above as the authorized user.
GET {{fragment1_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "The requested fragment doesn't exist."

# 8. GET all of the fragments for the same authorized user without expanding them
GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"

# Check if the fragments key is a list
jsonpath "$.fragments" isCollection

# Confirm that the first id is NOT included but that the second id is
jsonpath "$.fragments" not includes "{{fragment1_id}}"
jsonpath "$.fragments" includes "{{fragment2_id}}"
