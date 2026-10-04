"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Skeleton from "../Skeleton/Skeleton";
import cx from "../cx";
import styles from "./Table.module.css";

const TableContext = createContext(null);

function TableHead({ children, className, ...rest }) {
  const context = useContext(TableContext);

  return (
    <thead
      {...rest}
      ref={context?.headRef}
      data-scrolled={context?.edges.top || undefined}
      className={cx(styles.head, className)}
    >
      {children}
    </thead>
  );
}

function TableBody({
  children,
  loading,
  empty,
  columns,
  loadingRows,
  className,
  ...rest
}) {
  const context = useContext(TableContext);
  const isLoading = loading ?? context?.loading ?? false;
  const emptySlot = empty ?? context?.empty;
  const columnCount = columns ?? context?.columns ?? 1;
  const rowCount = loadingRows ?? context?.loadingRows ?? 4;
  const safeColumns = Number.isInteger(columnCount) && columnCount > 0 ? columnCount : 1;
  const safeRows = Number.isInteger(rowCount) && rowCount > 0 ? Math.min(rowCount, 12) : 4;

  if (isLoading && context?.loadingContent) return context.loadingContent;

  return (
    <tbody
      {...rest}
      ref={context?.bodyRef}
      aria-busy={isLoading || undefined}
      className={cx(styles.body, className)}
    >
      {isLoading
        ? Array.from({ length: safeRows }, (_, rowIndex) => (
            <TableRow key={`loading-${rowIndex}`} className={styles.skeletonRow}>
              {Array.from({ length: safeColumns }, (_, cellIndex) => (
                <TableCell key={`loading-${rowIndex}-${cellIndex}`}>
                  <Skeleton variant="text" width="100%" />
                </TableCell>
              ))}
            </TableRow>
          ))
        : emptySlot != null
          ? (
              <TableRow>
                <TableCell colSpan={safeColumns} className={styles.emptyCell}>
                  {emptySlot}
                </TableCell>
              </TableRow>
            )
          : children}
    </tbody>
  );
}

function TableRow({
  as: Component = "tr",
  hover = true,
  className,
  ...rest
}) {
  return (
    <Component
      {...rest}
      className={cx(styles.row, hover && styles.rowHover, className)}
    />
  );
}

function TableCell({
  as: Component = "td",
  numeric = false,
  className,
  scope,
  ...rest
}) {
  return (
    <Component
      {...rest}
      scope={Component === "th" ? scope || "col" : scope}
      className={cx(styles.cell, numeric && styles.numeric, className)}
    />
  );
}

export default function Table({
  children,
  loading = false,
  loadingContent,
  loadingRows = 4,
  empty,
  columns = 1,
  caption,
  maxHeight,
  className,
  ...rest
}) {
  const viewportRef = useRef(null);
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const [edges, setEdges] = useState({ top: false, left: false, right: true });

  useEffect(() => {
    function updateEdges() {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const header = headRef.current?.getBoundingClientRect();
      const rows = bodyRef.current?.querySelectorAll("tr") || [];
      const top = Boolean(header && [...rows].some((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top < header.bottom - 1 && rect.bottom > header.top;
      }));
      const left = viewport.scrollLeft > 1;
      const right = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;

      setEdges((previous) => previous.top === top && previous.left === left && previous.right === right
        ? previous
        : { top, left, right });
    }

    const frame = requestAnimationFrame(updateEdges);
    window.addEventListener("scroll", updateEdges, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateEdges, true);
    };
  }, []);

  const context = {
    bodyRef,
    columns,
    edges,
    empty,
    headRef,
    loading,
    loadingContent,
    loadingRows,
  };

  return (
    <TableContext.Provider value={context}>
      <div className={cx(styles.root, edges.left && styles.edgeLeft, edges.right && styles.edgeRight, className)}>
        <div ref={viewportRef} className={styles.viewport} style={maxHeight ? { maxHeight } : undefined}>
          <table {...rest} aria-busy={loading || undefined} className={styles.table}>
            {caption && <caption className={styles.caption}>{caption}</caption>}
            {children}
          </table>
        </div>
        {edges.top && <span aria-hidden="true" className={styles.topEdge} />}
        {edges.left && <span aria-hidden="true" className={styles.leftEdge} />}
        {edges.right && <span aria-hidden="true" className={styles.rightEdge} />}
      </div>
    </TableContext.Provider>
  );
}

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;