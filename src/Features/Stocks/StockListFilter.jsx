import { useStock } from "../../Contexts/StockContext";
import {
  STOCK_LIST_CATEGORY_OPTIONS,
  STOCK_SORT_OPTIONS,
} from "../../Constants/constants";

export default function StockListFilter() {
  const { setStockListCategory, setStockListSort } = useStock();
  return (
    <div className="stocklist-filter">
      <div className="stocklist-filter__controls">
        <select
          className="form-select"
          onChange={(e) => setStockListCategory(e.target.value)}
          aria-label="Filter stocks by category"
        >
          {Object.keys(STOCK_LIST_CATEGORY_OPTIONS).map((key) => {
            return (
              <option key={key} value={key}>
                {STOCK_LIST_CATEGORY_OPTIONS[key]}
              </option>
            );
          })}
        </select>

        <select
          className="form-select"
          onChange={(e) => setStockListSort(e.target.value)}
          aria-label="Sort stock list"
        >
          {Object.keys(STOCK_SORT_OPTIONS).map((key) => {
            return (
              <option key={key} value={key}>
                {STOCK_SORT_OPTIONS[key]}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
