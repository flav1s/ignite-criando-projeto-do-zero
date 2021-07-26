/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const totalWords = post.data.content.reduce((acc, contentItem) => {
    acc += contentItem.heading.split(' ').length;
    const words = contentItem.body.map(item => item.text.split(' ').length);

    words.map(word => (acc += word));
    return acc;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  if (isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <div className={styles.content}>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div className={commonStyles.postInfo}>
            <FiCalendar />
            <time>
              {format(new Date(post.first_publication_date), 'd MMM YYY', {
                locale: ptBR,
              }).toLowerCase()}
            </time>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{readTime > 0 ? `${readTime} min` : 'Carregando'}</span>
          </div>
          {post.data.content.map((section, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <section className={styles.postSection} key={index}>
              <strong>{section.heading}</strong>
              <div
                className={styles.postBody}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.uid'],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(result => ({
    params: { slug: result.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: { post: response },
    revalidate: 60 * 30, // 30 minutes
  };
};
