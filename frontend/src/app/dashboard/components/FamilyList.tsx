'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, ChevronUp, ChevronDown, X, RefreshCw } from 'lucide-react';
import { getAllFamilies } from '@/lib/api';
import { Family, AcademicYear } from '@/types/family';
import { normalizeVietnamese, getFamilySearchableText } from '@/utils/vietnamese';
import FamilyCard from './FamilyCard';
import FamilyModal from './FamilyModal';
import FamilyDetailModal from './FamilyDetailModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import Toast from './Toast';
import Pagination from './Pagination';

interface FamilyListProps {
  selectedYear: AcademicYear | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FamilyList({ selectedYear }: FamilyListProps) {
  // Cached data
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  
  // Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'family_name' | 'city' | 'state'>('family_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [viewingFamily, setViewingFamily] = useState<Family | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Debounce search - shorter delay since search is now instant
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 150); // Reduced from 300ms since search is now client-side
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load all families once
  const loadAllFamilies = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError(null);
    
    try {
      const families = await getAllFamilies();
      setAllFamilies(families);
      setLastFetchTime(new Date());
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load families:', err);
      setError('Failed to load families. Please try again.');
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadAllFamilies();
    }
  }, [loadAllFamilies]);

  // Client-side filtering with Vietnamese normalization
  const filteredFamilies = useMemo(() => {
    if (!debouncedSearch) return allFamilies;
    
    const normalizedQuery = normalizeVietnamese(debouncedSearch);
    
    return allFamilies.filter(family => {
      const searchableText = getFamilySearchableText(family);
      const normalizedText = normalizeVietnamese(searchableText);
      return normalizedText.includes(normalizedQuery);
    });
  }, [allFamilies, debouncedSearch]);

  // Client-side sorting
  const sortedFamilies = useMemo(() => {
    const sorted = [...filteredFamilies].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      
      if (sortBy === 'family_name') {
        aVal = a.family_name || '';
        bVal = b.family_name || '';
      } else if (sortBy === 'city') {
        aVal = a.city || '';
        bVal = b.city || '';
      } else if (sortBy === 'state') {
        aVal = a.state || '';
        bVal = b.state || '';
      }
      
      // Use Vietnamese normalization for sorting too
      aVal = normalizeVietnamese(aVal);
      bVal = normalizeVietnamese(bVal);
      
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredFamilies, sortBy, sortOrder]);

  // Client-side pagination
  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedFamilies.slice(startIndex, startIndex + pageSize);
  }, [sortedFamilies, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedFamilies.length / pageSize) || 1;
  const totalItems = sortedFamilies.length;

  const handleSort = (field: 'family_name' | 'city' | 'state') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadAllFamilies(true);
  };

  const handleFamilyCreated = () => {
    setIsCreateModalOpen(false);
    loadAllFamilies(true); // Refresh cache after create
    showToast('Family created successfully', 'success');
  };

  const handleFamilyUpdated = () => {
    setEditingFamily(null);
    loadAllFamilies(true); // Refresh cache after update
    showToast('Family updated successfully', 'success');
  };

  const handleFamilyDeleted = () => {
    setDeletingFamily(null);
    loadAllFamilies(true); // Refresh cache after delete
    showToast('Family deleted successfully', 'success');
  };

  // Handle family update from detail modal - updates cache directly without refresh
  const handleFamilyDetailUpdate = (updatedFamily: Family) => {
    setAllFamilies((prev) =>
      prev.map((f) => (f.id === updatedFamily.id ? updatedFamily : f))
    );
    // Also update viewingFamily to reflect changes
    setViewingFamily(updatedFamily);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: 'family_name' | 'city' | 'state';
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
        sortBy === field
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      {sortBy === field &&
        (sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        ))}
    </button>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Families</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              {totalItems} {totalItems === 1 ? 'family' : 'families'}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
            {lastFetchTime && (
              <span className="text-xs text-gray-400">
                • Last updated: {lastFetchTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Family
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search families (supports Vietnamese)..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <SortButton field="family_name" label="Name" />
          <SortButton field="city" label="City" />
          <SortButton field="state" label="State" />
        </div>
      </div>

      {/* Search indicator */}
      {debouncedSearch && !isInitialLoading && (
        <div className="mb-4 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          ⚡ Searching cached data instantly
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => loadAllFamilies()}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mt-3 text-gray-600">Loading all families...</span>
          <span className="mt-1 text-sm text-gray-400">This may take a moment for the initial load</span>
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && !error && sortedFamilies.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'No families found' : 'No families yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Try adjusting your search query'
              : 'Get started by creating your first family'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Family
            </button>
          )}
        </div>
      )}

      {/* Family Cards Grid */}
      {!isInitialLoading && !error && sortedFamilies.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedFamilies.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                onEdit={() => setEditingFamily(family)}
                onDelete={() => setDeletingFamily(family)}
                onViewDetails={() => setViewingFamily(family)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Create Family Modal */}
      {isCreateModalOpen && (
        <FamilyModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFamilyCreated}
          showToast={showToast}
        />
      )}

      {/* Edit Family Modal */}
      {editingFamily && (
        <FamilyModal
          family={editingFamily}
          onClose={() => setEditingFamily(null)}
          onSuccess={handleFamilyUpdated}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingFamily && (
        <DeleteConfirmDialog
          family={deletingFamily}
          onClose={() => setDeletingFamily(null)}
          onConfirm={handleFamilyDeleted}
          showToast={showToast}
        />
      )}

      {/* Family Detail Modal */}
      {viewingFamily && (
        <FamilyDetailModal
          family={viewingFamily}
          onClose={() => setViewingFamily(null)}
          onUpdate={handleFamilyDetailUpdate}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
