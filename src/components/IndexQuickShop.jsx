import React from "react";
import styles from "./IndexQuickShop.module.css";

export default function IndexQuickShop({ products, onViewMore, onAddAll }) {
  const totalRegulars = products.length;
  const selectedCount = products.filter((p) => p.quantity > 0).length;

  const progress =
    totalRegulars === 0 ? 0 : Math.min(100, (selectedCount / totalRegulars) * 100);

  return (
    <section className={styles.card} aria-label="Quick Shop your regulars">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>Quick Shop your regulars</div>
        <button className={styles.viewMore} type="button" onClick={onViewMore}>
          View more
        </button>
      </div>
      <p className={styles.cardBodyText}>
        Everything you buy is added to your Favourites. Add or remove items by selecting
        the heart icon.
      </p>
      <div className={styles.previewRow}>
        {products.slice(0, 6).map((product) => (
          <div key={product.id} className={styles.previewItem}>
            <span className={styles.badge}>{product.quantity}</span>
            <img
              src={product.image}
              alt={product.name}
              className={styles.previewImage}
            />
          </div>
        ))}
      </div>
      <div className={styles.progressBarOuter}>
        <div
          className={styles.progressBarInner}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onAddAll}
        disabled={selectedCount === 0}
      >
        Add {selectedCount} item{selectedCount !== 1 ? "s" : ""} to trolley
      </button>
    </section>
  );
}

