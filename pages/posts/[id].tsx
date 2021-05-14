import { GetServerSideProps, NextPage } from 'next';
import { Client } from '@notionhq/client/build/src';
import Layout from '../../components/Layout';
import {
  DatePropertyValue,
  TitlePropertyValue,
} from '@notionhq/client/build/src/api-types';

interface PostBlock {
  id: string;
  type:
    | 'heading_2'
    | 'paragraph'
    | 'heading_1'
    | 'heading_3'
    | 'bulleted_list_item'
    | 'numbered_list_item'
    | 'to_do'
    | 'toggle'
    | 'child_page'
    | 'unsupported';
  text: string;
}

interface Post {
  title: string;
  publishedAt: string;
  blocks: PostBlock[];
}

interface Props {
  post: Post;
}

const PostPage: NextPage<Props> = ({ post }) => (
  <Layout title={post.title}>
    <h1>{post.title}</h1>
    <p>{new Date(Date.parse(post.publishedAt)).toLocaleString()}</p>
    <section>
      {post.blocks.map((block) => {
        switch (block.type) {
          case 'heading_2':
            return <h2 key={block.id}>{block.text}</h2>;
          case 'paragraph':
            return <p key={block.id}>{block.text}</p>;
          case 'bulleted_list_item':
            return <p key={block.id}>・{block.text}</p>;
          default:
            return null;
        }
      })}
    </section>
  </Layout>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  /////////////////////////////////////////////////////////////////////////////
  // 投稿の page property の取得
  /////////////////////////////////////////////////////////////////////////////
  const postPageId = query.id as string;
  const postPageResponse = await notion.pages.retrieve({
    page_id: postPageId,
  });
  const postTitle = (postPageResponse.properties.Name as TitlePropertyValue)
    .title[0].plain_text;
  const postPublishedAt = (
    postPageResponse.properties.PublishedAt as DatePropertyValue
  ).date.start;

  /////////////////////////////////////////////////////////////////////////////
  // 投稿の page content の取得
  /////////////////////////////////////////////////////////////////////////////
  const postBlocksResponse = await notion.blocks.children.list({
    block_id: postPageId,
  });

  const postBlocks = postBlocksResponse.results.map((block): PostBlock => {
    switch (block.type) {
      case 'heading_2':
        return {
          id: block.id,
          type: block.type,
          text: (block as any).heading_2.text[0]?.plain_text || null,
        };
      case 'paragraph':
        return {
          id: block.id,
          type: block.type,
          text: (block as any).paragraph.text[0]?.plain_text || null,
        };
      case 'bulleted_list_item':
        return {
          id: block.id,
          type: block.type,
          text: (block as any).bulleted_list_item.text[0]?.plain_text || null,
        };
      default:
        return {
          id: block.id,
          type: 'unsupported',
          text: '',
        };
    }
  });

  return {
    props: {
      post: {
        title: postTitle,
        publishedAt: postPublishedAt,
        blocks: postBlocks,
      },
    },
  };
};

export default PostPage;
