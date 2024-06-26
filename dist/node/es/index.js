class DateVersion {
  static tags = ['YYYY', 'YY', '0Y', 'MM', '0M', 'WW', '0W', 'DD', '0D']

  reDigits = /[^0-9]/

  constructor(obj, parentSeperator, isInitialVersion, date) {
    this['YYYY'] = null;
    this['YY'] = null;
    this['0Y'] = null;
    this['MM'] = null;
    this['0M'] = null;
    this['WW'] = null;
    this['0W'] = null;
    this['DD'] = null;
    this['0D'] = null;

    this.hasChanged = false;
    this.isInitialVersion = isInitialVersion;
    this.parentSeperator = parentSeperator;
    this.props = [];
    this.date = date;

    this.parse(obj);
  }

  parse(obj) {
    for (const prop in obj) {
      if (!this.isInitialVersion && !this.isValid(prop, obj[prop])) {
        throw new Error(`Calendar tag ${prop} has an invalid value "${obj[prop]}"`)
      }

      this[prop] = obj[prop];
      this.props.push(prop);
    }
  }

  inc(level) {
    const prevValue = this.asString();

    const yearstr = this.date.getFullYear().toString();
    this['YYYY'] = yearstr;
    this['YY'] = parseInt(yearstr.slice(2)).toString();
    this['0Y'] = this['YY'].padStart(2, '0');

    const monthstr = (this.date.getMonth() + 1).toString();
    this['MM'] = monthstr;
    this['0M'] = this['MM'].padStart(2, '0');

    const weekstr = this.date.getWeek().toString();
    this['WW'] = weekstr;
    this['0W'] = this['WW'].padStart(2, '0');

    const daystr = this.date.getDate().toString();
    this['DD'] = daystr;
    this['0D'] = this['DD'].padStart(2, '0');

    const newValue = this.asString();

    this.hasChanged = prevValue != newValue;

    return this
  }

  isValid(prop, v) {
    if (!v || typeof v != 'string' || this.reDigits.test(v)) return false

    switch (prop) {
      case 'YYYY':
        if (v.slice(0, 1) == '0') return false
        return v.length === 4

      case 'YY':
        if (v.slice(0, 1) == '0') return false
        return v.length === 1 || v.length === 2 || v.length === 3

      case '0Y':
        if ((v.length == 2 || v.length == 3) && v.slice(0, 1) == '0') return false
        return v.length === 2 || v.length === 3

      case 'MM':
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(Number(v)) !== -1

      case '0M':
        return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
          .indexOf(v) !== -1

      case 'WW':
        return Number(v) >= 1 && Number(v) <= 52

      case '0W':
        if (v.length != 2) return false
        return Number(v) >= 1 && Number(v) <= 52

      case 'DD':
        return Number(v) >= 1 && Number(v) <= 31

      case '0D':
        if (v.length != 2) return false
        return Number(v) >= 1 && Number(v) <= 31
    }
  }

  asObject() {
    return this.props.reduce((memo, prop) => {
      memo[prop] = this[prop];
      return memo
    }, {})
  }

  asString() {
    const result = [];
    for (const tag of this.constructor.tags) {
      if (this.props.indexOf(tag) !== -1) result.push(this[tag]);
    }
    return result.join(this.parentSeperator)
  }
}

class SemanticVersion {
  static tags = ['MAJOR', 'MINOR', 'PATCH']

  reDigits = /[^0-9]/

  constructor(obj, parentSeperator, isInitialVersion, startFrom) {
    this.MAJOR = null;
    this.MINOR = null;
    this.PATCH = null;

    this.isInitialVersion = isInitialVersion;
    this.parentSeperator = parentSeperator;
    this.startFrom = startFrom;
    this.props = [];

    this.parse(obj);
  }

  parse(obj) {
    for (const prop in obj) {
      if (!this.isInitialVersion && !this.isValid(prop, obj[prop])) {
        throw new Error(`Semantic tag ${prop} has an invalid value "${obj[prop]}"`)
      }

      this[prop] = obj[prop];
      this.props.push(prop);
    }
  }

  reset() {
    this.props.map(prop => this[prop] = this.startFrom);
  }

  inc(level) {
    if (this.props.indexOf(level) === -1) {
      throw new Error(`[CALVER]: You have requested to increment "${level}" but your format doesn't have it.`)
    }

    if (level == 'MAJOR') {
      this.MAJOR = (parseInt(this.MAJOR) + 1).toString();
      if (this.props.indexOf('MINOR') !== -1) this.MINOR = this.startFrom.toString();
      if (this.props.indexOf('PATCH') !== -1) this.PATCH = this.startFrom.toString();
    }
    
    if (level == 'MINOR') {
      this.MINOR = (parseInt(this.MINOR) + 1).toString();
      if (this.props.indexOf('PATCH') !== -1) this.PATCH = this.startFrom.toString();
    }

    if (level == 'PATCH') {
      this.PATCH = (parseInt(this.PATCH) + 1).toString();
    }

    return this
  }

  isValid(prop, v) {
    if (!v || typeof v != 'string' || this.reDigits.test(v)) return false
    return true
  }

  asObject() {
    return this.props.reduce((memo, prop) => {
      memo[prop] = this[prop];
      return memo
    }, {})
  }

  asString() {
    const result = [];
    for (const tag of this.constructor.tags) {
      if (this.props.indexOf(tag) !== -1) result.push(this[tag]);
    }
    return result.join(this.parentSeperator)
  }
}

class ModifierVersion {
  static seperator = '-'
  static tags = ['DEV', 'ALPHA', 'BETA', 'RC']

  reDigits = /[^0-9\-]/

  constructor(obj, parentSeperator, isInitialVersion, startFrom) {
    this.DEV = null;
    this.ALPHA = null;
    this.BETA = null;
    this.RC = null;

    this.isInitialVersion = isInitialVersion;
    this.parentSeperator = parentSeperator;
    this.startFrom = startFrom;
    this.prop = null;

    this.parse(obj);
  }

  parse(obj) {
    for (const prop in obj) {
      if (!this.isInitialVersion && !this.isValid(prop, obj[prop])) {
        throw new Error(`Modifier tag ${prop} has an invalid value "${obj[prop]}"`)
      }

      this.prop = prop;
      this[prop] = obj[prop];
    }
  }

  inc(level) {
    if (level != this.prop) {
      throw new Error(`[CALVER]: You have requested to increment "${level}" but your format doesn't have it.`)
    }

    if (parseInt(this[this.prop]) === -1) this[this.prop] = this.startFrom.toString();
    else this[this.prop] = (parseInt(this[this.prop]) + 1).toString();

    return this
  }

  isValid(prop, v) {
    if (!v || typeof v != 'string' || this.reDigits.test(v)) return false
    if (v.indexOf('-') !== -1 && v != '-1') return false
    return true
  }

  asObject() {
    const result = {};
    result[this.prop] = this[this.prop];
    return result
  }

  asString() {
    return `${this.constructor.seperator}${this.prop}${this.parentSeperator}${this[this.prop]}`
  }
}

class UtcDate {
  constructor() {
    this.date = new Date(Date.now());
  }

  getFullYear() {
    return this.date.getUTCFullYear()
  }

  getMonth() {
    return this.date.getUTCMonth()
  }

  getWeek() {
    return this.getUTCWeek()
  }

  getDate() {
    return this.date.getUTCDate()
  }

  getUTCWeek() {
    const d = new Date(
      Date.UTC(
        this.date.getFullYear(),
        this.date.getMonth(),
        this.date.getDate()
      )
    );
    const daynum = d.getUTCDay() || 7;

    d.setUTCDate(d.getUTCDate() + 4 - daynum);

    const yearstart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

    return Math.ceil(((d - yearstart) / 86400000 + 1) / 7)
  }
}

class LocalDate {
  constructor() {
    this.date = new Date(Date.now());
  }

  getFullYear() {
    return this.date.getFullYear()
  }

  getMonth() {
    return this.date.getMonth()
  }

  getWeek() {
    return this.getWeek()
  }

  getDate() {
    return this.date.getDate()
  }

  getWeek() {
    const d = new Date(
      this.date.getFullYear(),
      this.date.getMonth(),
      this.date.getDate()
    );
    const daynum = d.getDay() || 7;

    d.setDate(d.getDate() + 4 - daynum);

    const yearstart = new Date(d.getFullYear(), 0, 1);

    return Math.ceil(((d - yearstart) / 86400000 + 1) / 7)
  }
}

class Version {
  constructor(version, seperator, date, startFrom) {
    this.seperator = seperator;
    this.startFrom = startFrom;
    this.versionStringHasModifier = version.versionStringHasModifier;
    this.isInitialVersion = version.isInitialVersion;
    this.isCalendarLeading = version.isCalendarLeading;
    this.datever = null;
    this.semanticver = null;
    this.modifierver = null;
    this.date = date;

    this.parse(version);
  }

  parse(version) {
    if (Object.keys(version.calendar).length > 0) {
      this.datever = new DateVersion(version.calendar, this.seperator, this.isInitialVersion, this.date);
    }

    if (Object.keys(version.semantic).length > 0) {
      this.semanticver = new SemanticVersion(version.semantic, this.seperator, this.isInitialVersion, this.startFrom);
    }

    if (Object.keys(version.modifier).length > 0) {
      this.modifierver = new ModifierVersion(version.modifier, this.seperator, this.isInitialVersion, this.startFrom);
    }
  }

  inc(levels) {
    const l = levels[0];

    const removeModifier = levels.length === 1 
      && ['MAJOR', 'MINOR', 'PATCH', 'CALENDAR'].indexOf(l) !== -1 
      && this.versionStringHasModifier;
    if (removeModifier) {
      this.modifierver = null;

      return this
    }

    if (l == 'CALENDAR') this.datever.inc(l);
    if (SemanticVersion.tags.indexOf(l) !== -1) this.semanticver.inc(l);
    if (ModifierVersion.tags.indexOf(l) !== -1) this.modifierver.inc(l);

    if (levels.length === 1) {
      if (this.isCalendarLeading && this.datever.hasChanged && this.semanticver) {
        this.semanticver.reset();
      }
    }
    else if (levels.length === 2) {
      const l2 = levels[1];

      if (ModifierVersion.tags.indexOf(l2) !== -1 && ModifierVersion.tags.indexOf(l) === -1) {
        this.modifierver.inc(l2);
        if (this.isCalendarLeading && this.datever.hasChanged && this.semanticver) {
          this.semanticver.reset();
        }
      }
      else if (SemanticVersion.tags.indexOf(l2) !== -1) {
        if (this.isCalendarLeading && this.datever.hasChanged) this.semanticver.reset();
        else {
          if (!this.versionStringHasModifier) this.semanticver.inc(l2);
        }
      }
      else {
        throw new Error(`The second tag of the level should be either modifier or semantic tag. You specified "${l2}" as the second tag and "${l}" as the first tag.`)
      }
    }
    else if (levels.length === 3) {
      const l2 = levels[1];
      const l3 = levels[2];

      if (SemanticVersion.tags.indexOf(l2) !== -1) {
        if (this.isCalendarLeading && this.datever.hasChanged) this.semanticver.reset();
        else {
          if (!this.versionStringHasModifier) this.semanticver.inc(l2);
        }
      }

      if (ModifierVersion.tags.includes(l3) && !ModifierVersion.tags.includes(l2) && !ModifierVersion.tags.includes(l)) {
        this.modifierver.inc(l3);
      }
      else {
        throw new Error(`The third tag of the level must be a modifier tag. You specified "${l3}".`)
      }
    }

    return this
  }

  asObject() {
    const result = {
      calendar: {},
      semantic: {},
      modifier: {}
    };

    if (this.datever) result.calendar = this.datever.asObject();
    if (this.semanticver) result.semantic = this.semanticver.asObject();
    if (this.modifierver) result.modifier = this.modifierver.asObject();

    return result
  }
}

class Calver {
  constructor() {
    this.seperator = '.';
    this.levels = ['CALENDAR', 'MAJOR', 'MINOR', 'PATCH', ...ModifierVersion.tags];
    this._useLocalTime = false,
    this.startFrom = 0;
  }

  inc(format, version, levels) {
    levels = this.validateLevels(levels);
    format = this.validateFormat(format, levels);
    const parsedVersion = this.parseVersion(version, format, levels, this.startFrom);
    const date = this._useLocalTime ? new LocalDate() : new UtcDate();

    const obj = (new Version(parsedVersion, this.seperator, date, this.startFrom)).inc(levels).asObject();

    const result = this.asString(format, obj);

    if (version == result) {
      throw new Error('No change happened in the version.')
    }

    return result
  }

  isValid(format, version) {
    if (!version) return false

    try {
      format = this.validateFormat(format, []);
      version = this.parseVersion(version, format, []);

      new Version(version, this.seperator);

      return true
    } catch (e) {
      return false
    }
  }

  getTagType(tag) {
    tag = tag.toUpperCase();

    if (DateVersion.tags.indexOf(tag) !== -1) return 'calendar'
    if (SemanticVersion.tags.indexOf(tag) !== -1) return 'semantic'
    if (ModifierVersion.tags.indexOf(tag) !== -1) return 'modifier'
    
    return undefined;
  }

  asString(format, obj) {
    const result = [];

    for (const tag of format.sorted) {
      if (DateVersion.tags.indexOf(tag) !== -1) {
        result.push(obj.calendar[tag]);
      }
      if (SemanticVersion.tags.indexOf(tag) !== -1) {
        result.push(obj.semantic[tag]);
      }
      if (ModifierVersion.tags.indexOf(tag) !== -1 && obj.modifier) {
        result.push(ModifierVersion.seperator + tag.toLowerCase() + this.seperator + obj.modifier[tag]);
      }
    }

    return result
      .join(this.seperator)
      .replace(this.seperator + ModifierVersion.seperator, ModifierVersion.seperator)
  }

  parseVersion(version, format, levels) {
    const map = {
      isCalendarLeading: format.isCalendarLeading,
      isInitialVersion: !version,
      versionStringHasModifier: /(dev|DEV|alpha|ALPHA|beta|BETA|rc|RC)/.test(version),
      sorted: {},
      calendar: {},
      semantic: {},
      modifier: {}
    };

    let startIndex=0, endIndex=0;
    for (const tag of format.sorted) {
      endIndex = version.indexOf(this.seperator, startIndex+1);
      if (endIndex === -1) endIndex = undefined;

      let value = version.slice(startIndex, endIndex);

      if (value.indexOf(ModifierVersion.seperator) !== -1) {
        endIndex = version.indexOf(ModifierVersion.seperator, startIndex+1);
        value = version.slice(startIndex, endIndex);
      }

      if (ModifierVersion.tags.indexOf(value.toUpperCase()) !== -1) {
        if (value.toUpperCase() != tag) value = (this.startFrom - 1).toString();
        else value = version.slice(startIndex + value.length + 1);
      }

      if (isNaN(startIndex)) {
        value = ModifierVersion.tags.indexOf(tag) !== -1 ? '-1' : '0';
      }

      if (value == '') {
        value = '0';
      }

      map.sorted[tag] = value;
      if (format.calendar.indexOf(tag) !== -1) map.calendar[tag] = value;
      if (format.semantic.indexOf(tag) !== -1) map.semantic[tag] = value;
      if (format.modifier.indexOf(tag) !== -1) map.modifier[tag] = value;

      startIndex = endIndex + 1;
    }

    return map
  }

  validateFormat(format, levels) {
    const result = {
      sorted: [],
      calendar: [],
      semantic: [],
      modifier: []
    };

    const tags = format.toUpperCase().split(this.seperator);

    for (const tag of tags) {
      if (DateVersion.tags.indexOf(tag) !== -1) result.calendar.push(tag);
      else if (SemanticVersion.tags.indexOf(tag) !== -1) result.semantic.push(tag);
      else throw new Error(`[CALVER]: Invalid format tag "${tag}".`)

      result.sorted.push(tag);
    }

    for (const level of levels) {
      if (ModifierVersion.tags.indexOf(level) !== -1) {
        result.modifier.push(level);
        result.sorted.push(level);
      }
    }

    result.isCalendarLeading = DateVersion.tags.indexOf(result.sorted[0]) !== -1;

    return result
  }

  validateLevels(levels) {
    const result = [];
    const arr = levels.split('.');

    for (const level of arr) {
      const formatted = level.toUpperCase();
      if (this.levels.indexOf(formatted) !== -1) {
        result.push(formatted);
      }
      else {
        throw new Error(`[CALVER]: Invalid level "${level}".`)
      }
    }

    return result
  }

  set useLocalTime(value) {
    this._useLocalTime = value;
  }
}

var index = new Calver();

export { index as default };
//# sourceMappingURL=index.js.map
