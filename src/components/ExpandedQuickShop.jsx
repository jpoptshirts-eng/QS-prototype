import React, { useMemo } from "react";
import styles from "./ExpandedQuickShop.module.css";

export default function ExpandedQuickShop({
  products,
  view,
  onChangeView,
  onChangeQuantity,
}) {
  const { estimatedTotal, totalCount } = useMemo(() => {
    const estimatedTotal = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );
    const totalCount = products.reduce(
      (sum, p) => sum + (p.quantity > 0 ? p.quantity : 0),
      0
    );
    return { estimatedTotal, totalCount };
  }, [products]);

  return (
    <>
      <div className={styles.statsBar}>
        <div className={styles.statsLabel}>
          Estimated total:{" "}
          <span className={styles.statsEmphasis}>
            £{estimatedTotal.toFixed(2)} ({totalCount})
          </span>
        </div>
        <div className={styles.viewToggle} aria-label="Choose view">
          <button
            type="button"
            className={`${styles.toggleButton} ${
              view === "grid" ? styles.toggleButtonActive : ""
            }`}
            onClick={() => onChangeView("grid")}
          >
            ▦
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${
              view === "list" ? styles.toggleButtonActive : ""
            }`}
            onClick={() => onChangeView("list")}
          >
            ☰
          </button>
        </div>
      </div>

      <div className={styles.feed}>
        {view === "grid" ? (
          <div className={styles.grid}>
            {products.map((product) => {
              const isZero = product.quantity === 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  className={styles.gridItem}
                  onClick={() =>
                    onChangeQuantity(product.id, product.quantity === 0 ? 1 : 0)
                  }
                >
                  <span
                    className={`${styles.gridBadge} ${
                      isZero ? styles.gridBadgeZero : ""
                    }`}
                  >
                    {product.quantity}
                  </span>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.gridImage}
                  />
                  <div className={styles.gridName}>{product.name}</div>
                  <div className={styles.gridWeight}>{product.weight}</div>
                  <div className={styles.gridQuantityTap}>
                    {isZero ? "Tap to add" : "Tap to remove"}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.list}>
            {products.map((product) => (
              <div key={product.id} className={styles.listItem}>
                <div className={styles.listImageWrapper}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.listImage}
                  />
                </div>
                <div className={styles.listContent}>
                  <div>
                    <div className={styles.listTitle}>{product.name}</div>
                    <div className={styles.listMeta}>
                      {product.weight} • {product.category}
                    </div>
                  </div>
                  <div>
                    <div className={styles.listPriceRow}>
                      <span className={styles.listPrice}>
                        £{product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        className={styles.stepperButton}
                        onClick={() =>
                          onChangeQuantity(
                            product.id,
                            Math.max(0, product.quantity - 1)
                          )
                        }
                      >
                        −
                      </button>
                      <div className={styles.stepperValue}>
                        {product.quantity}
                      </div>
                      <button
                        type="button"
                        className={styles.stepperButton}
                        onClick={() =>
                          onChangeQuantity(product.id, product.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

