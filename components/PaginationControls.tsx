import { Colors } from '@/constants/NeumorphicStyles';
import { ChevronLeft, ChevronRight } from 'lucide';
import { MorphIcon } from 'morphicons/react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemName?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemName = 'productos',
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show (maximum 5 page buttons around currentPage)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <View style={styles.container}>
      {totalItems !== undefined && (
        <Text style={styles.counterText}>
          Página {currentPage} de {totalPages} • {totalItems} {itemName}
        </Text>
      )}

      <View style={styles.buttonsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
          onPress={() => canGoPrev && onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          activeOpacity={0.8}
        >
          <MorphIcon
            icon={ChevronLeft}
            size={18}
            color={canGoPrev ? Colors.textPrimary : Colors.textPlaceholder}
          />
          <Text
            style={[
              styles.navButtonText,
              !canGoPrev && styles.navButtonTextDisabled,
            ]}
          >
          </Text>
        </TouchableOpacity>

        {/* Number Pills */}
        <View style={styles.pagesList}>
          {pages.map((p) => {
            const isActive = p === currentPage;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.pagePill, isActive && styles.pagePillActive]}
                onPress={() => onPageChange(p)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pagePillText,
                    isActive && styles.pagePillTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          onPress={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.navButtonText,
              !canGoNext && styles.navButtonTextDisabled,
            ]}
          >
            
          </Text>
          <MorphIcon
            icon={ChevronRight}
            size={18}
            color={canGoNext ? Colors.textPrimary : Colors.textPlaceholder}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  counterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonDisabled: {
    opacity: 0.45,
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  navButtonTextDisabled: {
    color: Colors.textPlaceholder,
  },
  pagesList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  pagePillActive: {
    backgroundColor: Colors.magenta,
    borderColor: Colors.magenta,
    shadowColor: Colors.magenta,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  pagePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pagePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
