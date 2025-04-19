import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../src/styles/Table.css';

export type Column<T> = {
  key: string;
  title: string;
  render?: (item: T, index: number) => ReactNode;
  width?: string | number;
  className?: string;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  emptyText?: string;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  animated?: boolean;
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const Table = <T extends {}>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className = '',
  tableClassName = '',
  headerClassName = 'bg-gray-50 dark:bg-gray-800',
  bodyClassName = 'bg-white dark:bg-gray-900',
  emptyText = 'No data available',
  isLoading = false,
  loadingComponent,
  animated = true,
}: TableProps<T>) => {
  // Wrapper for content to ensure dark mode compatibility
  const ContentWrapper = ({ children }: { children: ReactNode }) => (
    <div className="text-gray-700 dark:text-gray-300">{children}</div>
  );

  // Animated row component
  const AnimatedRow = ({ item, index }: { item: T; index: number }) => (
    <motion.tr
      key={keyExtractor(item)}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150' : ''} border-b border-gray-200 dark:border-gray-700`}
      onClick={() => onRowClick && onRowClick(item)}
    >
      {columns.map(column => (
        <td
          key={`${keyExtractor(item)}-${column.key}`}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
        >
          {column.render ? (
            <ContentWrapper>{column.render(item, index)}</ContentWrapper>
          ) : (
            <ContentWrapper>{(item as any)[column.key]}</ContentWrapper>
          )}
        </td>
      ))}
    </motion.tr>
  );

  // Regular row component
  const RegularRow = ({ item, index }: { item: T; index: number }) => (
    <tr
      key={keyExtractor(item)}
      className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150' : ''} border-b border-gray-200 dark:border-gray-700`}
      onClick={() => onRowClick && onRowClick(item)}
    >
      {columns.map(column => (
        <td
          key={`${keyExtractor(item)}-${column.key}`}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
        >
          {column.render ? (
            <ContentWrapper>{column.render(item, index)}</ContentWrapper>
          ) : (
            <ContentWrapper>{(item as any)[column.key]}</ContentWrapper>
          )}
        </td>
      ))}
    </tr>
  );

  // Loading animation
  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const LoadingAnimation = () => (
    <div className="flex justify-center items-center py-8">
      <motion.div
        animate="animate"
        variants={loadingVariants}
        className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner"
      />
      <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading data...</span>
    </div>
  );

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${tableClassName}`}
      >
        <thead className={headerClassName}>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.className || ''}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${bodyClassName}`}>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                {loadingComponent || <LoadingAnimation />}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">{emptyText}</p>
                </div>
              </td>
            </tr>
          ) : (
            <AnimatePresence>
              {data.map((item, index) =>
                animated ? (
                  <AnimatedRow key={keyExtractor(item)} item={item} index={index} />
                ) : (
                  <RegularRow key={keyExtractor(item)} item={item} index={index} />
                )
              )}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
