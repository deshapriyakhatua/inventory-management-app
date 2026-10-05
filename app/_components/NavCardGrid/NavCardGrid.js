import Link from "next/link";
import Icon from "@/components/ui/Icon/Icon";
import Card from "@/components/ui/Card/Card";
import cx from "@/components/ui/cx";
import styles from "./NavCardGrid.module.css";

const tones = [1, 2, 3, 4, 5, 6];

export default function NavCardGrid({ title, cards }) {
  return (
    <section className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {cards.map((card) => (
          <Card
            key={card.href}
            as={Link}
            href={card.href}
            variant="raised"
            className={cx(styles.card, styles[`tone${tones.includes(card.tone) ? card.tone : 1}`])}
          >
            <span aria-hidden="true" className={styles.icon}>
              <Icon name={card.icon} size={24} />
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{card.label}</span>
              <span className={styles.desc}>{card.desc}</span>
            </span>
            <Icon name="icon-8a780677" size={16} className={styles.arrow} />
          </Card>
        ))}
      </div>
    </section>
  );
}
