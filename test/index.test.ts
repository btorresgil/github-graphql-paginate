import { graphqlPaginate, gql } from '../src/index'

const mockResponse = (obj: { [key: string]: any }) => ({ foo: { bar: obj } })

describe('gql', () => {
  it('should remove carriage returns', () => {
    const query = gql`
      query {
        test(first: 100)
      }
    `
    const expected = '       query {         test(first: 100)       }     '
    expect(query).toBe(expected)
  })
})

describe('graphqlPaginate', () => {
  let mockClient: jest.Mock<any, any>

  beforeEach(() => {
    mockClient = jest.fn().mockName('graphqlClient')
  })

  it('should return one page of edges', async () => {
    mockClient.mockReturnValue(
      mockResponse({
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [{ id: 1 }, { id: 2 }],
        nodes: [{ id: 1 }],
      }),
    )
    const response = await graphqlPaginate(mockClient, 'mockQuery', 'foo.bar')
    expect(response).toHaveLength(2)
    expect(response).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('should return one page of nodes', async () => {
    mockClient.mockReturnValue(
      mockResponse({
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        nodes: [{ id: 1 }, { id: 2 }],
      }),
    )
    const response = await graphqlPaginate(mockClient, 'mockQuery', 'foo.bar')
    expect(response).toHaveLength(2)
    expect(response).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('should return two pages of edges', async () => {
    mockClient
      .mockReturnValueOnce(
        mockResponse({
          pageInfo: {
            hasNextPage: true,
            endCursor: 'abc123',
          },
          edges: [{ id: 1 }, { id: 2 }, { id: 3 }],
          nodes: [{ id: 1 }],
        }),
      )
      .mockReturnValueOnce(
        mockResponse({
          pageInfo: { hasNextPage: false, endCursor: null },
          edges: [{ id: 4 }, { id: 5 }],
          nodes: [{ id: 1 }],
        }),
      )
    const response = await graphqlPaginate(mockClient, 'mockQuery', 'foo.bar')
    expect(mockClient).toBeCalledTimes(2)
    expect(mockClient.mock.calls[1][1]).toMatchObject({ endCursor: 'abc123' })
    expect(response).toHaveLength(5)
    expect(response).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
    ])
  })

  it('should return two pages of nodes', async () => {
    mockClient
      .mockReturnValueOnce(
        mockResponse({
          pageInfo: {
            hasNextPage: true,
            endCursor: 'abc123',
          },
          nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
        }),
      )
      .mockReturnValueOnce(
        mockResponse({
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [{ id: 4 }, { id: 5 }],
        }),
      )
    const response = await graphqlPaginate(mockClient, 'mockQuery', 'foo.bar')
    expect(mockClient).toBeCalledTimes(2)
    expect(mockClient.mock.calls[1][1]).toMatchObject({ endCursor: 'abc123' })
    expect(response).toHaveLength(5)
    expect(response).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
    ])
  })
})
