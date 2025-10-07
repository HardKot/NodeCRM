class QueryBuilder {
  constructor(table = '') {
    this.table = table;
    this.selectFields = [];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
  }

  // SELECT методы
  select(fields = '*') {
    if (typeof fields === 'string') {
      this.selectFields.push(fields);
    } else if (Array.isArray(fields)) {
      this.selectFields.push(...fields);
    }
    return this;
  }

  from(table) {
    this.table = table;
    return this;
  }

  // WHERE методы
  where(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    this.whereConditions.push({ field, operator, value, type: 'AND' });
    return this;
  }

  orWhere(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    this.whereConditions.push({ field, operator, value, type: 'OR' });
    return this;
  }

  whereIn(field, values) {
    this.whereConditions.push({
      field,
      operator: 'IN',
      value: values,
      type: 'AND',
    });
    return this;
  }

  // JOIN методы
  join(table, condition) {
    this.joinClauses.push({ type: 'INNER JOIN', table, condition });
    return this;
  }

  leftJoin(table, condition) {
    this.joinClauses.push({ type: 'LEFT JOIN', table, condition });
    return this;
  }

  // ORDER BY
  orderBy(field, direction = 'ASC') {
    this.orderByFields.push({ field, direction: direction.toUpperCase() });
    return this;
  }

  // LIMIT и OFFSET
  limit(count) {
    this.limitValue = count;
    return this;
  }

  offset(count) {
    this.offsetValue = count;
    return this;
  }

  // Построение запроса
  toSql() {
    let sql = '';

    // SELECT
    const fields = this.selectFields.length > 0 ? this.selectFields.join(', ') : '*';
    sql += `SELECT ${fields}`;

    // FROM
    if (this.table) {
      sql += ` FROM ${this.table}`;
    }

    // JOIN
    if (this.joinClauses.length > 0) {
      sql +=
        ' ' +
        this.joinClauses.map(join => `${join.type} ${join.table} ON ${join.condition}`).join(' ');
    }

    // WHERE
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ';
      sql += this.whereConditions
        .map((condition, index) => {
          let clause = '';

          if (index > 0) {
            clause += ` ${condition.type} `;
          }

          if (condition.operator === 'IN') {
            const values = Array.isArray(condition.value)
              ? condition.value.map(v => this.escapeValue(v)).join(', ')
              : condition.value;
            clause += `${condition.field} IN (${values})`;
          } else {
            clause += `${condition.field} ${condition.operator} ${this.escapeValue(condition.value)}`;
          }

          return clause;
        })
        .join('');
    }

    // ORDER BY
    if (this.orderByFields.length > 0) {
      sql +=
        ' ORDER BY ' +
        this.orderByFields.map(order => `${order.field} ${order.direction}`).join(', ');
    }

    // LIMIT
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // OFFSET
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  // Экранирование значений
  escapeValue(value) {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return value;
  }

  // Сброс состояния
  reset() {
    this.table = '';
    this.selectFields = [];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    return this;
  }
}

export { QueryBuilder };
