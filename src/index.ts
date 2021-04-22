/**
 * Type for part of response with list of nodes
 *
 */
type GraphqlClientResponseNodes = {
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
  edges: { [key: string]: any }[]
  nodes: { [key: string]: any }[]
}

/**
 * Type for graphqlClient function
 *
 * @export
 */
export type GraphqlClient = (
  query: string,
  variables: { [key: string]: any },
) => Promise<any>

/**
 * Helper function to remove carriage returns and effect syntax highlighting to
 * improve readability of GraphQL queries in code.
 *
 * @export
 * @param {TemplateStringsArray} string - The GraphQL query
 * @returns {string} - The GraphQL query on a single line
 */
export function gql(string: TemplateStringsArray): string {
  return String(string).replace(/\n/g, ' ')
}

/**
 * Helper function to get the node in an object at a specific path represented
 * by a string.
 *
 * @export
 * @param {Object} object - The object to resolve the path on
 * @param {string} path - String path to node. Use `.` in between each path segment
 * @param {*} [defaultValue] - Value to return if the path can't be resolved
 * @returns {*} - The item at the path in the object, or defaultValue if the
 * path isn't resolvable
 */
export const resolvePath = (
  object: any,
  path: string,
  defaultValue?: any,
): GraphqlClientResponseNodes =>
  path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), object)

/**
 * Fetches all items from a paginated GraphQL query.
 *
 * @export
 * @param {GraphqlClient} graphqlClient - GraphQLClient function callable with
 * query and variables as first and second parameters
 * @param {string} query - GraphQL query string. Query must includes `nodes` and
 * `pageInfo` containing `hasNextPage` and `endCursor`
 * @param {string} pathToNodes - Path to the `edges` or `nodes` list where
 * pagination is needed to get all entries
 * @param {Object} queryVariables - Object with any GraphQL variables. These are
 * passed directly to the graphqlClient. Any variable called `after` will be overridden.
 * @param {string} [endCursor=null] - Used during recursion to pull the next
 * page. Should be null on first call to this function.
 * @returns {Promise<Array>} - Array of all nodes from all pages
 */
export const graphqlPaginate = async (
  graphqlClient: GraphqlClient,
  query: string,
  pathToNodes: string,
  queryVariables: { [key: string]: any } = {},
  endCursor: string | null = null,
): Promise<any[]> => {
  const response = await graphqlClient(query, { ...queryVariables, endCursor })
  // TODO: Add error checking here
  const {
    edges,
    nodes,
    pageInfo: { hasNextPage, endCursor: newEndCursor },
  } = resolvePath(response, pathToNodes)
  const items = edges || nodes
  if (!hasNextPage) {
    return items
  }
  return [
    ...items,
    ...(await graphqlPaginate(
      graphqlClient,
      query,
      pathToNodes,
      queryVariables,
      newEndCursor,
    )),
  ]
}
