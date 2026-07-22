/**
 * SearchController
 * -----------------------------------------------------------------------
 * Manages query aggregation and real-time stay discovery workflows.
 * Endpoint: GET /api/v1/listings/search
 * -----------------------------------------------------------------------
 */
class SearchController {
  constructor({ searchGateway } = {}) {
    // searchGateway abstracts wherever listing matches ultimately come
    // from — intentionally not a concrete DB query per design scope.
    this._searchGateway = searchGateway || {
      async findMatches(/* criteria */) {
        return [];
      },
    };
  }

  /**
   * Validates and binds traveler search windows.
   * @param {string|Date} start
   * @param {string|Date} end
   * @returns {{ start: Date, end: Date }}
   */
  captureCalendarDates(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Invalid calendar dates supplied');
    }
    if (startDate >= endDate) {
      throw new Error('start date must precede end date');
    }
    return { start: startDate, end: endDate };
  }

  /**
   * Sets spatial boundaries for geography-based filtering.
   * @param {number} zoomLevel
   * @param {{ north: number, south: number, east: number, west: number }} coordinates
   * @returns {{ zoomLevel: number, bounds: object }}
   */
  captureMapBoundaries(zoomLevel, coordinates) {
    const zoom = Number(zoomLevel);
    if (Number.isNaN(zoom) || zoom < 0) {
      throw new Error('Invalid zoom level');
    }
    const { north, south, east, west } = coordinates || {};
    if ([north, south, east, west].some((v) => typeof v !== 'number')) {
      throw new Error('Map boundaries require numeric north/south/east/west coordinates');
    }
    return { zoomLevel: zoom, bounds: { north, south, east, west } };
  }

  /**
   * Merges temporal (calendar) and spatial (map) bounds to return
   * filtered property matrices to the client.
   * @param {{ start: Date, end: Date }} dateWindow
   * @param {{ zoomLevel: number, bounds: object }} mapBoundaries
   * @returns {Promise<Array<object>>}
   */
  async queryAndRenderProperties(dateWindow, mapBoundaries) {
    return this._searchGateway.findMatches({
      dateWindow,
      mapBoundaries,
    });
  }

  /**
   * Express handler for GET /api/v1/listings/search
   */
  handleSearch = async (req, res) => {
    try {
      const { startDate, endDate, zoomLevel, north, south, east, west } = req.query;

      const dateWindow = this.captureCalendarDates(startDate, endDate);
      const mapBoundaries = this.captureMapBoundaries(zoomLevel, {
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west),
      });

      const matches = await this.queryAndRenderProperties(dateWindow, mapBoundaries);

      return res.status(200).json({
        criteria: { dateWindow, mapBoundaries },
        results: matches,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  };
}

module.exports = SearchController;
