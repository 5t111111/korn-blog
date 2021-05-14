import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { Client } from '@notionhq/client/build/src';
import Layout from '../components/Layout';
import {
  DatePropertyValue,
  TitlePropertyValue,
} from '@notionhq/client/build/src/api-types';

interface PostListItem {
  id: string;
  title: string;
  publishedAt: string;
}

interface Props {
  siteTitle: string;
  postListItems: PostListItem[];
}

const IndexPage: NextPage<Props> = ({ siteTitle, postListItems }) => (
  <Layout title={siteTitle}>
    <h1>{siteTitle}</h1>
    <ul>
      {postListItems.map((postListItem) => (
        <li key={postListItem.id}>
          <Link href={`/posts/${postListItem.id}`}>{`${
            postListItem.title
          } - ${new Date(
            Date.parse(postListItem.publishedAt)
          ).toLocaleString()}`}</Link>
        </li>
      ))}
    </ul>
  </Layout>
);

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  /////////////////////////////////////////////////////////////////////////////
  // サイトタイトルの取得
  /////////////////////////////////////////////////////////////////////////////
  const parentPageId = 'd283163cf4d04b2194937b635608fcd6';
  const parentPageResponse = await notion.pages.retrieve({
    page_id: parentPageId,
  });
  const siteTitle = (parentPageResponse.properties.title as TitlePropertyValue)
    .title[0].plain_text;

  /////////////////////////////////////////////////////////////////////////////
  // 投稿リストの取得
  /////////////////////////////////////////////////////////////////////////////
  const postsDatabaseId = '932de24ca9724886b1602d0f6a1fc199';
  const postsResponse = await notion.databases.query({
    database_id: postsDatabaseId,
    sorts: [
      {
        property: 'PublishedAt',
        direction: 'descending',
      },
    ],
  });

  const postListItems = postsResponse.results.map(
    (item): PostListItem => ({
      id: item.id,
      title: (item.properties.Name as TitlePropertyValue).title[0].plain_text,
      publishedAt: (item.properties.PublishedAt as DatePropertyValue).date
        .start,
    })
  );

  return {
    props: {
      siteTitle,
      postListItems,
    },
  };
};

export default IndexPage;
