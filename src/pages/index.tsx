/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => setNextPage(data));
  }, [postsPagination.next_page]);

  async function handleLoadMorePosts(): Promise<void> {
    console.log(nextPage);
    // console.log(postsPagination.next_page);
  }
  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.sectionContainer}>
          {postsPagination.results.map(post => (
            <a key={post.uid} href="/">
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.postInfo}>
                <FiCalendar />
                <time>{post.first_publication_date}</time>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
            </a>
          ))}
        </section>
        <span onClick={handleLoadMorePosts}>Carregar mais posts</span>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 10,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(result => ({
      uid: result.uid,
      first_publication_date: format(
        new Date(result.last_publication_date),
        'PP',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: result.data.title,
        subtitle: result.data.subtitle,
        author: result.data.author,
      },
    })),
  };

  return {
    props: {
      postsPagination,
    },
  };
};
