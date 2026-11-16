const APPOINTMENT_STATUSES = ["pending", "approved", "rejected", "cancelled"];

function parsePagination(query) {
  const pageValue = query.page;
  const limitValue = query.limit;
  const paginationRequested = pageValue !== undefined || limitValue !== undefined;
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = paginationRequested
    ? limitValue === undefined
      ? 20
      : Number(limitValue)
    : null;

  if (
    (pageValue !== undefined &&
      (typeof pageValue !== "string" || !/^[1-9]\d*$/.test(pageValue))) ||
    (limitValue !== undefined &&
      (typeof limitValue !== "string" || !/^[1-9]\d*$/.test(limitValue))) ||
    !Number.isSafeInteger(page) ||
    (limit !== null &&
      (!Number.isSafeInteger(limit) ||
        limit > 100 ||
        !Number.isSafeInteger((page - 1) * limit)))
  ) {
    return { error: "page must be a positive integer and limit must be between 1 and 100" };
  }

  return {
    page,
    limit,
    skip: limit === null ? 0 : (page - 1) * limit,
  };
}

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseAppointmentFilters(query) {
  const filter = {};
  if (query.status !== undefined) {
    if (
      typeof query.status !== "string" ||
      !APPOINTMENT_STATUSES.includes(query.status)
    ) {
      return { error: "status must be pending, approved, rejected, or cancelled" };
    }
    filter.status = query.status;
  }

  const hasDate = query.date !== undefined;
  const hasDateFrom = query.dateFrom !== undefined;
  const hasDateTo = query.dateTo !== undefined;
  if (hasDate && (hasDateFrom || hasDateTo)) {
    return { error: "Use date or dateFrom/dateTo, not both" };
  }

  if (hasDate) {
    const date = parseDate(query.date);
    if (!date) {
      return { error: "date must be a valid YYYY-MM-DD date" };
    }
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.appointmentDate = { $gte: date, $lt: nextDay };
  } else if (hasDateFrom || hasDateTo) {
    const start = hasDateFrom ? parseDate(query.dateFrom) : undefined;
    const end = hasDateTo ? parseDate(query.dateTo) : undefined;
    if ((hasDateFrom && !start) || (hasDateTo && !end)) {
      return { error: "dateFrom and dateTo must be valid YYYY-MM-DD dates" };
    }
    if (start && end && start > end) {
      return { error: "dateFrom must be on or before dateTo" };
    }

    filter.appointmentDate = {};
    if (start) {
      filter.appointmentDate.$gte = start;
    }
    if (end) {
      const dayAfterEnd = new Date(end);
      dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
      filter.appointmentDate.$lt = dayAfterEnd;
    }
  }

  return { filter };
}

function paginationResponse(page, limit, total) {
  return {
    page,
    limit: limit ?? total,
    total,
    totalPages: limit === null ? (total === 0 ? 0 : 1) : Math.ceil(total / limit),
  };
}

export { parsePagination, parseAppointmentFilters, paginationResponse };
