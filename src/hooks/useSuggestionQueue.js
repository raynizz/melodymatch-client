import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useSuggestionQueue({ fetcher, threshold = 5 } = {}) {
  const [queue, setQueue] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [hasNoMore, setHasNoMore] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const seenIds = useRef(new Set());

  const fetchMore = useCallback(async () => {
    if (isFetching || hasNoMore) return;
    setIsFetching(true);
    setStatusMessage("");
    try {
      const suggestions = (await fetcher()) ?? [];
      if (!suggestions.length) {
        setHasNoMore(true);
        return;
      }

      const unique = suggestions.filter((item) => {
        const id = item?.melodyMatchUserId;
        if (!id || seenIds.current.has(id)) return false;
        seenIds.current.add(id);
        return true;
      });

      if (!unique.length) {
        setHasNoMore(true);
        return;
      }

      setQueue((prev) => [...prev, ...unique]);
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
      setStatusMessage("load-error");
    } finally {
      setIsFetching(false);
    }
  }, [fetcher, hasNoMore, isFetching]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  useEffect(() => {
    if (!hasNoMore && !isFetching && queue.length <= threshold) {
      fetchMore();
    }
  }, [fetchMore, hasNoMore, isFetching, queue.length, threshold]);

  const currentProfile = queue[0] ?? null;

  const advance = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const state = useMemo(
    () => ({
      queue,
      currentProfile,
      isFetching,
      hasNoMore,
      statusMessage,
    }),
    [queue, currentProfile, isFetching, hasNoMore, statusMessage]
  );

  return { ...state, fetchMore, advance, setStatusMessage };
}
