
Catalog API
===========

`GET|POST /<dataSourceType>/[?…]`
---------------------------------

Provide search results for the criteria given as query arguments.

* If the POST method is used, a form-encoded body is expected.
* If an argument is provided in the query string and the body,
  the value from the body will win, even if it is an empty string.


### Path components

* `<dataSourceType>`: Which data provider module can access the catalog.
  Supported values:
  * `memcat`: Holds the data in memory.
  * `proxycat`: Delegates the search effort to another server.


### Query arguments

* `c`: Catalog ID. Required.
* `s`: Search keyword(s), separated by whitespace.
  Behavior for multiple keywords is "and", i.e. entries must include all words.
* `n`: Number of results to deliver.
  Default: 0. May be ignored if unsupported.
  * Some catalog implementations may override the default value.
  * Server config may override the default value.
* `o`: Offset: How many results to omit from the top of the list.
  Default: 0. May be ignored if unsupported.
* `r`: Ranked by. Supported values may differ by catalog type and data source.


### Success response

A JSON body that is a list.
The first list item is metadata, the remainder are the catalog items.
Usual metadata fields:

* `query`: The effective parameter values that the server has used to process
  the request, after any potential decoding, parsing, range validation etc.
* `subject`: Meta data about the catalog itself.
* `nFound`: How many catalog items were found, i.e. match the criteria.
  In catalogs that support pagination, this number may exceed the amount
  of results reported in this reply.
  * May be omitted or `null` is the catalog doesn't support it.
* `nTotalCatalogItems`: How many catalog items have been considered.
* `nSkipped`: How many results have been omitted from the top of the list.
  If a number, it indicates that the catalog supports pagination.
  * If `nSkipped` is smaller than your offset parameter:
    * If `nFound === 0`: You paginated beyond the last page of results.
      May indicate a user interface bug or race condition.
      Usually not a problem.
    * If `nFound > 0`:
      The reply may contain items that should have been omitted.
      Most likely a server bug.

Each catalog item usually contains at least these keys:

* `dc:title`: Human-readable name.
* `dc:identifier`: URI.




