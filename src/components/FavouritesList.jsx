import React from "react";
import styles from "./FavouritesList.module.css";

export default function FavouritesList({ products }) {
  const first = products[0];

  if (!first) return null;

  return (
    <section className={styles.wrapper} aria-label="All favourites">
      <h2 className={styles.sectionHeader}>All favourites</h2>
      <div className={styles.filterRow}>
        <button type="button" className={styles.filterButton}>
          Filter
        </button>
      </div>
      <div className={styles.sortRow}>
        <span>Sort by</span>
        <span className={styles.chip}>Category</span>
        <span className={styles.chip}>Frequently bought</span>
      </div>
      <h3 className={styles.categoryHeading}>Beer, Wine &amp; Spirits</h3>
      <div className={styles.favouriteCard}>
        <div className={styles.favInfo}>
          <div className={styles.favName}>{first.name}</div>
          <div className={styles.favMeta}>{first.weight}</div>
        </div>
        <div className={styles.favPrice}>£{first.price.toFixed(2)}</div>
      </div>
    </section>
  );
}

