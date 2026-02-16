import axios from 'axios';
import { User, PaginatedResponse, Pagination } from '@cube-demper/types';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SearchService {
  private elasticsearchUrl = config.search.elasticsearchUrl;
  private userIndex = config.search.userIndex;

  /**
   * Index user in Elasticsearch
   */
  async indexUser(user: User): Promise<void> {
    try {
      const document = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        fullName: `${user.firstName} ${user.lastName} ${user.middleName || ''}`.trim(),
        position: user.position,
        department: user.department,
        organization: user.organization,
        role: user.role,
        status: user.status,
        isOnline: user.isOnline,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      await axios.put(
        `${this.elasticsearchUrl}/${this.userIndex}/_doc/${user.id}`,
        document,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      logger.debug('User indexed in Elasticsearch', { userId: user.id });
    } catch (error) {
      logger.error('Failed to index user in Elasticsearch', {
        error: (error as Error).message,
        userId: user.id,
      });
      // Don't throw error - search indexing is not critical
    }
  }

  /**
   * Delete user from Elasticsearch
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.elasticsearchUrl}/${this.userIndex}/_doc/${userId}`,
        { timeout: 5000 }
      );

      logger.debug('User deleted from Elasticsearch', { userId });
    } catch (error) {
      logger.error('Failed to delete user from Elasticsearch', {
        error: (error as Error).message,
        userId,
      });
    }
  }

  /**
   * Search users in Elasticsearch
   */
  async searchUsers(
    query: string,
    pagination: Pagination
  ): Promise<PaginatedResponse<User>> {
    try {
      const { page, limit } = pagination;
      const from = (page - 1) * limit;

      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: [
                    'firstName^3',
                    'lastName^3',
                    'fullName^2',
                    'email^2',
                    'position',
                    'department',
                    'organization',
                  ],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [
              { term: { status: 'active' } },
            ],
          },
        },
        sort: [
          { _score: { order: 'desc' } },
          { 'firstName.keyword': { order: 'asc' } },
        ],
        from,
        size: limit,
        _source: {
          excludes: ['digitalCertificate'],
        },
      };

      const response = await axios.post(
        `${this.elasticsearchUrl}/${this.userIndex}/_search`,
        searchQuery,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const hits = response.data.hits;
      const users = hits.hits.map((hit: any) => ({
        id: hit._source.id,
        ...hit._source,
        createdAt: new Date(hit._source.createdAt),
        updatedAt: new Date(hit._source.updatedAt),
      }));

      const total = hits.total.value;
      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Elasticsearch search failed', {
        error: (error as Error).message,
        query,
        pagination,
      });

      // Return empty result on search failure
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Get user suggestions for autocomplete
   */
  async getUserSuggestions(query: string, limit: number = 10): Promise<User[]> {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['firstName', 'lastName', 'fullName'],
                  type: 'phrase_prefix',
                },
              },
            ],
            filter: [
              { term: { status: 'active' } },
            ],
          },
        },
        sort: [
          { _score: { order: 'desc' } },
        ],
        size: limit,
        _source: ['id', 'firstName', 'lastName', 'email', 'position', 'avatar'],
      };

      const response = await axios.post(
        `${this.elasticsearchUrl}/${this.userIndex}/_search`,
        searchQuery,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 3000,
        }
      );

      return response.data.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Get user suggestions failed', {
        error: (error as Error).message,
        query,
      });
      return [];
    }
  }

  /**
   * Initialize Elasticsearch index
   */
  async initializeIndex(): Promise<void> {
    try {
      // Check if index exists
      const indexExists = await axios.head(
        `${this.elasticsearchUrl}/${this.userIndex}`,
        { timeout: 5000 }
      ).then(() => true).catch(() => false);

      if (!indexExists) {
        // Create index with mapping
        const mapping = {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              email: { type: 'keyword' },
              firstName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              lastName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              middleName: { type: 'text' },
              fullName: { type: 'text' },
              position: { type: 'text' },
              department: { type: 'text' },
              organization: { type: 'text' },
              role: { type: 'keyword' },
              status: { type: 'keyword' },
              isOnline: { type: 'boolean' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                russian_analyzer: {
                  type: 'standard',
                  stopwords: '_russian_',
                },
              },
            },
          },
        };

        await axios.put(
          `${this.elasticsearchUrl}/${this.userIndex}`,
          mapping,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        logger.info('Elasticsearch index created', { index: this.userIndex });
      }
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch index', {
        error: (error as Error).message,
        index: this.userIndex,
      });
    }
  }

  /**
   * Bulk index users
   */
  async bulkIndexUsers(users: User[]): Promise<void> {
    try {
      if (users.length === 0) return;

      const body = [];
      for (const user of users) {
        body.push({ index: { _index: this.userIndex, _id: user.id } });
        body.push({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          fullName: `${user.firstName} ${user.lastName} ${user.middleName || ''}`.trim(),
          position: user.position,
          department: user.department,
          organization: user.organization,
          role: user.role,
          status: user.status,
          isOnline: user.isOnline,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      }

      await axios.post(
        `${this.elasticsearchUrl}/_bulk`,
        body.map(item => JSON.stringify(item)).join('\n') + '\n',
        {
          headers: { 'Content-Type': 'application/x-ndjson' },
          timeout: 30000,
        }
      );

      logger.info('Bulk indexed users', { count: users.length });
    } catch (error) {
      logger.error('Bulk index users failed', {
        error: (error as Error).message,
        userCount: users.length,
      });
    }
  }
}
