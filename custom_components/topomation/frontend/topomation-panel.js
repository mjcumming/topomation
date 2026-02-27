/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, Je = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ti = Symbol(), li = /* @__PURE__ */ new WeakMap();
let Ui = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== ti) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Je && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = li.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && li.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const xo = (n) => new Ui(typeof n == "string" ? n : n + "", void 0, ti), Gt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, o, a) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + n[a + 1], n[0]);
  return new Ui(e, n, ti);
}, So = (n, t) => {
  if (Je) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = ne.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, n.appendChild(i);
  }
}, ci = Je ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return xo(e);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: $o, defineProperty: Eo, getOwnPropertyDescriptor: ko, getOwnPropertyNames: Ao, getOwnPropertySymbols: To, getPrototypeOf: Do } = Object, st = globalThis, di = st.trustedTypes, Co = di ? di.emptyScript : "", $e = st.reactiveElementPolyfillSupport, zt = (n, t) => n, He = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? Co : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, t) {
  let e = n;
  switch (t) {
    case Boolean:
      e = n !== null;
      break;
    case Number:
      e = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(n);
      } catch {
        e = null;
      }
  }
  return e;
} }, Hi = (n, t) => !$o(n, t), ui = { attribute: !0, type: String, converter: He, reflect: !1, useDefault: !1, hasChanged: Hi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), st.litPropertyMetadata ?? (st.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let St = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ui) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && Eo(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: a } = ko(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: o, set(r) {
      const s = o == null ? void 0 : o.call(this);
      a == null || a.call(this, r), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ui;
  }
  static _$Ei() {
    if (this.hasOwnProperty(zt("elementProperties"))) return;
    const t = Do(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(zt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(zt("properties"))) {
      const e = this.properties, i = [...Ao(e), ...To(e)];
      for (const o of i) this.createProperty(o, e[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, o] of e) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const o = this._$Eu(e, i);
      o !== void 0 && this._$Eh.set(o, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const o of i) e.unshift(ci(o));
    } else t !== void 0 && e.push(ci(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return So(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var a;
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const r = (((a = i.converter) == null ? void 0 : a.toAttribute) !== void 0 ? i.converter : He).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var a, r;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = i.getPropertyOptions(o), l = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((a = s.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? s.converter : He;
      this._$Em = o;
      const c = l.fromAttribute(e, s.type);
      this[o] = c ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var o;
    if (t !== void 0) {
      const a = this.constructor, r = this[t];
      if (i ?? (i = a.getPropertyOptions(t)), !((i.hasChanged ?? Hi)(r, e) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: a }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), a !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, r] of this._$Ep) this[a] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [a, r] of o) {
        const { wrapped: s } = r, l = this[a];
        s !== !0 || this._$AL.has(a) || l === void 0 || this.C(a, void 0, r, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((o) => {
        var a;
        return (a = o.hostUpdate) == null ? void 0 : a.call(o);
      }), this.update(e)) : this._$EM();
    } catch (o) {
      throw t = !1, this._$EM(), o;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
St.elementStyles = [], St.shadowRootOptions = { mode: "open" }, St[zt("elementProperties")] = /* @__PURE__ */ new Map(), St[zt("finalized")] = /* @__PURE__ */ new Map(), $e == null || $e({ ReactiveElement: St }), (st.reactiveElementVersions ?? (st.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, de = Ut.trustedTypes, hi = de ? de.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, qi = "$lit$", ot = `lit$${Math.random().toFixed(9).slice(2)}$`, Wi = "?" + ot, Lo = `<${Wi}>`, yt = document, jt = () => yt.createComment(""), Xt = (n) => n === null || typeof n != "object" && typeof n != "function", ei = Array.isArray, Io = (n) => ei(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", Ee = `[ 	
\f\r]`, Rt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, pi = /-->/g, fi = />/g, ht = RegExp(`>|${Ee}(?:([^\\s"'>=/]+)(${Ee}*=${Ee}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), gi = /'/g, mi = /"/g, Ki = /^(?:script|style|textarea|title)$/i, Oo = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), _ = Oo(1), j = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), _i = /* @__PURE__ */ new WeakMap(), vt = yt.createTreeWalker(yt, 129);
function Vi(n, t) {
  if (!ei(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return hi !== void 0 ? hi.createHTML(t) : t;
}
const Po = (n, t) => {
  const e = n.length - 1, i = [];
  let o, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = Rt;
  for (let s = 0; s < e; s++) {
    const l = n[s];
    let c, u, d = -1, h = 0;
    for (; h < l.length && (r.lastIndex = h, u = r.exec(l), u !== null); ) h = r.lastIndex, r === Rt ? u[1] === "!--" ? r = pi : u[1] !== void 0 ? r = fi : u[2] !== void 0 ? (Ki.test(u[2]) && (o = RegExp("</" + u[2], "g")), r = ht) : u[3] !== void 0 && (r = ht) : r === ht ? u[0] === ">" ? (r = o ?? Rt, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, c = u[1], r = u[3] === void 0 ? ht : u[3] === '"' ? mi : gi) : r === mi || r === gi ? r = ht : r === pi || r === fi ? r = Rt : (r = ht, o = void 0);
    const p = r === ht && n[s + 1].startsWith("/>") ? " " : "";
    a += r === Rt ? l + Lo : d >= 0 ? (i.push(c), l.slice(0, d) + qi + l.slice(d) + ot + p) : l + ot + (d === -2 ? s : p);
  }
  return [Vi(n, a + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Yt {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let a = 0, r = 0;
    const s = t.length - 1, l = this.parts, [c, u] = Po(t, e);
    if (this.el = Yt.createElement(c, i), vt.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = vt.nextNode()) !== null && l.length < s; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(qi)) {
          const h = u[r++], p = o.getAttribute(d).split(ot), f = /([.?@])?(.*)/.exec(h);
          l.push({ type: 1, index: a, name: f[2], strings: p, ctor: f[1] === "." ? Mo : f[1] === "?" ? No : f[1] === "@" ? Bo : we }), o.removeAttribute(d);
        } else d.startsWith(ot) && (l.push({ type: 6, index: a }), o.removeAttribute(d));
        if (Ki.test(o.tagName)) {
          const d = o.textContent.split(ot), h = d.length - 1;
          if (h > 0) {
            o.textContent = de ? de.emptyScript : "";
            for (let p = 0; p < h; p++) o.append(d[p], jt()), vt.nextNode(), l.push({ type: 2, index: ++a });
            o.append(d[h], jt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Wi) l.push({ type: 2, index: a });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(ot, d + 1)) !== -1; ) l.push({ type: 7, index: a }), d += ot.length - 1;
      }
      a++;
    }
  }
  static createElement(t, e) {
    const i = yt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function At(n, t, e = n, i) {
  var r, s;
  if (t === j) return t;
  let o = i !== void 0 ? (r = e._$Co) == null ? void 0 : r[i] : e._$Cl;
  const a = Xt(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== a && ((s = o == null ? void 0 : o._$AO) == null || s.call(o, !1), a === void 0 ? o = void 0 : (o = new a(n), o._$AT(n, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = At(n, o._$AS(n, t.values), o, i)), t;
}
let Ro = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, o = ((t == null ? void 0 : t.creationScope) ?? yt).importNode(e, !0);
    vt.currentNode = o;
    let a = vt.nextNode(), r = 0, s = 0, l = i[0];
    for (; l !== void 0; ) {
      if (r === l.index) {
        let c;
        l.type === 2 ? c = new Dt(a, a.nextSibling, this, t) : l.type === 1 ? c = new l.ctor(a, l.name, l.strings, this, t) : l.type === 6 && (c = new Fo(a, this, t)), this._$AV.push(c), l = i[++s];
      }
      r !== (l == null ? void 0 : l.index) && (a = vt.nextNode(), r++);
    }
    return vt.currentNode = yt, o;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class Dt {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, o) {
    this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = At(this, t, e), Xt(t) ? t === O || t == null || t === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : t !== this._$AH && t !== j && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Io(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== O && Xt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(yt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var a;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Yt.createElement(Vi(i.h, i.h[0]), this.options)), i);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === o) this._$AH.p(e);
    else {
      const r = new Ro(o, this), s = r.u(this.options);
      r.p(e), this.T(s), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = _i.get(t.strings);
    return e === void 0 && _i.set(t.strings, e = new Yt(t)), e;
  }
  k(t) {
    ei(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const a of t) o === e.length ? e.push(i = new Dt(this.O(jt()), this.O(jt()), this, this.options)) : i = e[o], i._$AI(a), o++;
    o < e.length && (this._$AR(i && i._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const o = t.nextSibling;
      t.remove(), t = o;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class we {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, o, a) {
    this.type = 1, this._$AH = O, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = O;
  }
  _$AI(t, e = this, i, o) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) t = At(this, t, e, 0), r = !Xt(t) || t !== this._$AH && t !== j, r && (this._$AH = t);
    else {
      const s = t;
      let l, c;
      for (t = a[0], l = 0; l < a.length - 1; l++) c = At(this, s[i + l], e, l), c === j && (c = this._$AH[l]), r || (r = !Xt(c) || c !== this._$AH[l]), c === O ? t = O : t !== O && (t += (c ?? "") + a[l + 1]), this._$AH[l] = c;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Mo extends we {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === O ? void 0 : t;
  }
}
class No extends we {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== O);
  }
}
class Bo extends we {
  constructor(t, e, i, o, a) {
    super(t, e, i, o, a), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = At(this, t, e, 0) ?? O) === j) return;
    const i = this._$AH, o = t === O && i !== O || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, a = t !== O && (i === O || o);
    o && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Fo {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    At(this, t);
  }
}
const zo = { I: Dt }, ke = Ut.litHtmlPolyfillSupport;
ke == null || ke(Yt, Dt), (Ut.litHtmlVersions ?? (Ut.litHtmlVersions = [])).push("3.3.1");
const Uo = (n, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const a = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new Dt(t.insertBefore(jt(), a), a, void 0, e ?? {});
  }
  return o._$AI(n), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bt = globalThis;
let lt = class extends St {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Uo(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return j;
  }
};
var Pi;
lt._$litElement$ = !0, lt.finalized = !0, (Pi = bt.litElementHydrateSupport) == null || Pi.call(bt, { LitElement: lt });
const Ae = bt.litElementPolyfillSupport;
Ae == null || Ae({ LitElement: lt });
(bt.litElementVersions ?? (bt.litElementVersions = [])).push("4.2.1");
const xe = Gt`
  :host {
    /* HA theme variables with fallbacks */
    --primary-color: var(--primary-color, #03a9f4);
    --primary-text-color: var(--primary-text-color, #212121);
    --secondary-text-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --secondary-background-color: var(--secondary-background-color, #f5f5f5);
    --disabled-text-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

    /* Aliases for compatibility */
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --disabled-color: var(--disabled-text-color, #9e9e9e);

    /* RGB variants for rgba() usage */
    --rgb-primary-color: 3, 169, 244;
    --rgb-error-color: 244, 67, 54;
    --rgb-warning-color: 255, 152, 0;
    --rgb-success-color: 76, 175, 80;

    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 4px;
    --transition-speed: 0.2s;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: var(--card-background-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
  }

  .section-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    letter-spacing: 0.5px;
  }

  .divider {
    height: 1px;
    background: var(--divider-color);
    margin: var(--spacing-md) 0;
  }

  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
  }

  .button-primary {
    background: var(--primary-color, #03a9f4);
    color: white !important;
    border: none;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4) !important;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] .button-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-button {
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary-color);
    border-radius: var(--border-radius);
    transition: all var(--transition-speed);
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color);
  }

  .text-muted {
    color: var(--text-secondary-color);
    font-size: 12px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 12px;
    margin-top: var(--spacing-xs);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }

  .empty-state-message {
    margin-bottom: var(--spacing-md);
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-state-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
  }
`;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const mt = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, ji = (n) => (...t) => ({ _$litDirective$: n, values: t });
class Xi {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Ho } = zo, qo = (n) => n.strings === void 0, vi = () => document.createComment(""), Mt = (n, t, e) => {
  var a;
  const i = n._$AA.parentNode, o = t === void 0 ? n._$AB : t._$AA;
  if (e === void 0) {
    const r = i.insertBefore(vi(), o), s = i.insertBefore(vi(), o);
    e = new Ho(r, s, n, n.options);
  } else {
    const r = e._$AB.nextSibling, s = e._$AM, l = s !== n;
    if (l) {
      let c;
      (a = e._$AQ) == null || a.call(e, n), e._$AM = n, e._$AP !== void 0 && (c = n._$AU) !== s._$AU && e._$AP(c);
    }
    if (r !== o || l) {
      let c = e._$AA;
      for (; c !== r; ) {
        const u = c.nextSibling;
        i.insertBefore(c, o), c = u;
      }
    }
  }
  return e;
}, pt = (n, t, e = n) => (n._$AI(t, e), n), Wo = {}, Yi = (n, t = Wo) => n._$AH = t, Ko = (n) => n._$AH, Te = (n) => {
  n._$AR(), n._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bi = (n, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = t; o <= e; o++) i.set(n[o], o);
  return i;
}, Vo = ji(class extends Xi {
  constructor(n) {
    if (super(n), n.type !== mt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(n, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const o = [], a = [];
    let r = 0;
    for (const s of n) o[r] = i ? i(s, r) : r, a[r] = e(s, r), r++;
    return { values: a, keys: o };
  }
  render(n, t, e) {
    return this.dt(n, t, e).values;
  }
  update(n, [t, e, i]) {
    const o = Ko(n), { values: a, keys: r } = this.dt(t, e, i);
    if (!Array.isArray(o)) return this.ut = r, a;
    const s = this.ut ?? (this.ut = []), l = [];
    let c, u, d = 0, h = o.length - 1, p = 0, f = a.length - 1;
    for (; d <= h && p <= f; ) if (o[d] === null) d++;
    else if (o[h] === null) h--;
    else if (s[d] === r[p]) l[p] = pt(o[d], a[p]), d++, p++;
    else if (s[h] === r[f]) l[f] = pt(o[h], a[f]), h--, f--;
    else if (s[d] === r[f]) l[f] = pt(o[d], a[f]), Mt(n, l[f + 1], o[d]), d++, f--;
    else if (s[h] === r[p]) l[p] = pt(o[h], a[p]), Mt(n, o[d], o[h]), h--, p++;
    else if (c === void 0 && (c = bi(r, p, f), u = bi(s, d, h)), c.has(s[d])) if (c.has(s[h])) {
      const m = u.get(r[p]), $ = m !== void 0 ? o[m] : null;
      if ($ === null) {
        const A = Mt(n, o[d]);
        pt(A, a[p]), l[p] = A;
      } else l[p] = pt($, a[p]), Mt(n, o[d], $), o[m] = null;
      p++;
    } else Te(o[h]), h--;
    else Te(o[d]), d++;
    for (; p <= f; ) {
      const m = Mt(n, l[f + 1]);
      pt(m, a[p]), l[p++] = m;
    }
    for (; d <= h; ) {
      const m = o[d++];
      m !== null && Te(m);
    }
    return this.ut = r, Yi(n, l), j;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function yi(n, t) {
  var e = Object.keys(n);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(n);
    t && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(n, o).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function Y(n) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? yi(Object(e), !0).forEach(function(i) {
      jo(n, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(e)) : yi(Object(e)).forEach(function(i) {
      Object.defineProperty(n, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return n;
}
function ae(n) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ae = function(t) {
    return typeof t;
  } : ae = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ae(n);
}
function jo(n, t, e) {
  return t in n ? Object.defineProperty(n, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : n[t] = e, n;
}
function Z() {
  return Z = Object.assign || function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (n[i] = e[i]);
    }
    return n;
  }, Z.apply(this, arguments);
}
function Xo(n, t) {
  if (n == null) return {};
  var e = {}, i = Object.keys(n), o, a;
  for (a = 0; a < i.length; a++)
    o = i[a], !(t.indexOf(o) >= 0) && (e[o] = n[o]);
  return e;
}
function Yo(n, t) {
  if (n == null) return {};
  var e = Xo(n, t), i, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(n);
    for (o = 0; o < a.length; o++)
      i = a[o], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(n, i) && (e[i] = n[i]);
  }
  return e;
}
var Go = "1.15.6";
function Q(n) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(n);
}
var J = Q(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Qt = Q(/Edge/i), wi = Q(/firefox/i), Ht = Q(/safari/i) && !Q(/chrome/i) && !Q(/android/i), ii = Q(/iP(ad|od|hone)/i), Gi = Q(/chrome/i) && Q(/android/i), Qi = {
  capture: !1,
  passive: !1
};
function E(n, t, e) {
  n.addEventListener(t, e, !J && Qi);
}
function S(n, t, e) {
  n.removeEventListener(t, e, !J && Qi);
}
function ue(n, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), n)
      try {
        if (n.matches)
          return n.matches(t);
        if (n.msMatchesSelector)
          return n.msMatchesSelector(t);
        if (n.webkitMatchesSelector)
          return n.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Zi(n) {
  return n.host && n !== document && n.host.nodeType ? n.host : n.parentNode;
}
function V(n, t, e, i) {
  if (n) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? n.parentNode === e && ue(n, t) : ue(n, t)) || i && n === e)
        return n;
      if (n === e) break;
    } while (n = Zi(n));
  }
  return null;
}
var xi = /\s+/g;
function z(n, t, e) {
  if (n && t)
    if (n.classList)
      n.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + n.className + " ").replace(xi, " ").replace(" " + t + " ", " ");
      n.className = (i + (e ? " " + t : "")).replace(xi, " ");
    }
}
function v(n, t, e) {
  var i = n && n.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(n, "") : n.currentStyle && (e = n.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function kt(n, t) {
  var e = "";
  if (typeof n == "string")
    e = n;
  else
    do {
      var i = v(n, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (n = n.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(e);
}
function Ji(n, t, e) {
  if (n) {
    var i = n.getElementsByTagName(t), o = 0, a = i.length;
    if (e)
      for (; o < a; o++)
        e(i[o], o);
    return i;
  }
  return [];
}
function X() {
  var n = document.scrollingElement;
  return n || document.documentElement;
}
function I(n, t, e, i, o) {
  if (!(!n.getBoundingClientRect && n !== window)) {
    var a, r, s, l, c, u, d;
    if (n !== window && n.parentNode && n !== X() ? (a = n.getBoundingClientRect(), r = a.top, s = a.left, l = a.bottom, c = a.right, u = a.height, d = a.width) : (r = 0, s = 0, l = window.innerHeight, c = window.innerWidth, u = window.innerHeight, d = window.innerWidth), (t || e) && n !== window && (o = o || n.parentNode, !J))
      do
        if (o && o.getBoundingClientRect && (v(o, "transform") !== "none" || e && v(o, "position") !== "static")) {
          var h = o.getBoundingClientRect();
          r -= h.top + parseInt(v(o, "border-top-width")), s -= h.left + parseInt(v(o, "border-left-width")), l = r + a.height, c = s + a.width;
          break;
        }
      while (o = o.parentNode);
    if (i && n !== window) {
      var p = kt(o || n), f = p && p.a, m = p && p.d;
      p && (r /= m, s /= f, d /= f, u /= m, l = r + u, c = s + d);
    }
    return {
      top: r,
      left: s,
      bottom: l,
      right: c,
      width: d,
      height: u
    };
  }
}
function Si(n, t, e) {
  for (var i = rt(n, !0), o = I(n)[t]; i; ) {
    var a = I(i)[e], r = void 0;
    if (r = o >= a, !r) return i;
    if (i === X()) break;
    i = rt(i, !1);
  }
  return !1;
}
function Tt(n, t, e, i) {
  for (var o = 0, a = 0, r = n.children; a < r.length; ) {
    if (r[a].style.display !== "none" && r[a] !== b.ghost && (i || r[a] !== b.dragged) && V(r[a], e.draggable, n, !1)) {
      if (o === t)
        return r[a];
      o++;
    }
    a++;
  }
  return null;
}
function oi(n, t) {
  for (var e = n.lastElementChild; e && (e === b.ghost || v(e, "display") === "none" || t && !ue(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function q(n, t) {
  var e = 0;
  if (!n || !n.parentNode)
    return -1;
  for (; n = n.previousElementSibling; )
    n.nodeName.toUpperCase() !== "TEMPLATE" && n !== b.clone && (!t || ue(n, t)) && e++;
  return e;
}
function $i(n) {
  var t = 0, e = 0, i = X();
  if (n)
    do {
      var o = kt(n), a = o.a, r = o.d;
      t += n.scrollLeft * a, e += n.scrollTop * r;
    } while (n !== i && (n = n.parentNode));
  return [t, e];
}
function Qo(n, t) {
  for (var e in n)
    if (n.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === n[e][i]) return Number(e);
    }
  return -1;
}
function rt(n, t) {
  if (!n || !n.getBoundingClientRect) return X();
  var e = n, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var o = v(e);
      if (e.clientWidth < e.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return X();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return X();
}
function Zo(n, t) {
  if (n && t)
    for (var e in t)
      t.hasOwnProperty(e) && (n[e] = t[e]);
  return n;
}
function De(n, t) {
  return Math.round(n.top) === Math.round(t.top) && Math.round(n.left) === Math.round(t.left) && Math.round(n.height) === Math.round(t.height) && Math.round(n.width) === Math.round(t.width);
}
var qt;
function to(n, t) {
  return function() {
    if (!qt) {
      var e = arguments, i = this;
      e.length === 1 ? n.call(i, e[0]) : n.apply(i, e), qt = setTimeout(function() {
        qt = void 0;
      }, t);
    }
  };
}
function Jo() {
  clearTimeout(qt), qt = void 0;
}
function eo(n, t, e) {
  n.scrollLeft += t, n.scrollTop += e;
}
function io(n) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(n).cloneNode(!0) : e ? e(n).clone(!0)[0] : n.cloneNode(!0);
}
function oo(n, t, e) {
  var i = {};
  return Array.from(n.children).forEach(function(o) {
    var a, r, s, l;
    if (!(!V(o, t.draggable, n, !1) || o.animated || o === e)) {
      var c = I(o);
      i.left = Math.min((a = i.left) !== null && a !== void 0 ? a : 1 / 0, c.left), i.top = Math.min((r = i.top) !== null && r !== void 0 ? r : 1 / 0, c.top), i.right = Math.max((s = i.right) !== null && s !== void 0 ? s : -1 / 0, c.right), i.bottom = Math.max((l = i.bottom) !== null && l !== void 0 ? l : -1 / 0, c.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var B = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function tn() {
  var n = [], t;
  return {
    captureAnimationState: function() {
      if (n = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(v(o, "display") === "none" || o === b.ghost)) {
            n.push({
              target: o,
              rect: I(o)
            });
            var a = Y({}, n[n.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = kt(o, !0);
              r && (a.top -= r.f, a.left -= r.e);
            }
            o.fromRect = a;
          }
        });
      }
    },
    addAnimationState: function(i) {
      n.push(i);
    },
    removeAnimationState: function(i) {
      n.splice(Qo(n, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var a = !1, r = 0;
      n.forEach(function(s) {
        var l = 0, c = s.target, u = c.fromRect, d = I(c), h = c.prevFromRect, p = c.prevToRect, f = s.rect, m = kt(c, !0);
        m && (d.top -= m.f, d.left -= m.e), c.toRect = d, c.thisAnimationDuration && De(h, d) && !De(u, d) && // Make sure animatingRect is on line between toRect & fromRect
        (f.top - d.top) / (f.left - d.left) === (u.top - d.top) / (u.left - d.left) && (l = on(f, h, p, o.options)), De(d, u) || (c.prevFromRect = u, c.prevToRect = d, l || (l = o.options.animation), o.animate(c, f, d, l)), l && (a = !0, r = Math.max(r, l), clearTimeout(c.animationResetTimer), c.animationResetTimer = setTimeout(function() {
          c.animationTime = 0, c.prevFromRect = null, c.fromRect = null, c.prevToRect = null, c.thisAnimationDuration = null;
        }, l), c.thisAnimationDuration = l);
      }), clearTimeout(t), a ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, r) : typeof i == "function" && i(), n = [];
    },
    animate: function(i, o, a, r) {
      if (r) {
        v(i, "transition", ""), v(i, "transform", "");
        var s = kt(this.el), l = s && s.a, c = s && s.d, u = (o.left - a.left) / (l || 1), d = (o.top - a.top) / (c || 1);
        i.animatingX = !!u, i.animatingY = !!d, v(i, "transform", "translate3d(" + u + "px," + d + "px,0)"), this.forRepaintDummy = en(i), v(i, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")), v(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          v(i, "transition", ""), v(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, r);
      }
    }
  };
}
function en(n) {
  return n.offsetWidth;
}
function on(n, t, e, i) {
  return Math.sqrt(Math.pow(t.top - n.top, 2) + Math.pow(t.left - n.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var wt = [], Ce = {
  initializeByDefault: !0
}, Zt = {
  mount: function(t) {
    for (var e in Ce)
      Ce.hasOwnProperty(e) && !(e in t) && (t[e] = Ce[e]);
    wt.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), wt.push(t);
  },
  pluginEvent: function(t, e, i) {
    var o = this;
    this.eventCanceled = !1, i.cancel = function() {
      o.eventCanceled = !0;
    };
    var a = t + "Global";
    wt.forEach(function(r) {
      e[r.pluginName] && (e[r.pluginName][a] && e[r.pluginName][a](Y({
        sortable: e
      }, i)), e.options[r.pluginName] && e[r.pluginName][t] && e[r.pluginName][t](Y({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, o) {
    wt.forEach(function(s) {
      var l = s.pluginName;
      if (!(!t.options[l] && !s.initializeByDefault)) {
        var c = new s(t, e, t.options);
        c.sortable = t, c.options = t.options, t[l] = c, Z(i, c.defaults);
      }
    });
    for (var a in t.options)
      if (t.options.hasOwnProperty(a)) {
        var r = this.modifyOption(t, a, t.options[a]);
        typeof r < "u" && (t.options[a] = r);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return wt.forEach(function(o) {
      typeof o.eventProperties == "function" && Z(i, o.eventProperties.call(e[o.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var o;
    return wt.forEach(function(a) {
      t[a.pluginName] && a.optionListeners && typeof a.optionListeners[e] == "function" && (o = a.optionListeners[e].call(t[a.pluginName], i));
    }), o;
  }
};
function nn(n) {
  var t = n.sortable, e = n.rootEl, i = n.name, o = n.targetEl, a = n.cloneEl, r = n.toEl, s = n.fromEl, l = n.oldIndex, c = n.newIndex, u = n.oldDraggableIndex, d = n.newDraggableIndex, h = n.originalEvent, p = n.putSortable, f = n.extraEventProperties;
  if (t = t || e && e[B], !!t) {
    var m, $ = t.options, A = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !J && !Qt ? m = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (m = document.createEvent("Event"), m.initEvent(i, !0, !0)), m.to = r || e, m.from = s || e, m.item = o || e, m.clone = a, m.oldIndex = l, m.newIndex = c, m.oldDraggableIndex = u, m.newDraggableIndex = d, m.originalEvent = h, m.pullMode = p ? p.lastPutMode : void 0;
    var y = Y(Y({}, f), Zt.getEventProperties(i, t));
    for (var k in y)
      m[k] = y[k];
    e && e.dispatchEvent(m), $[A] && $[A].call(t, m);
  }
}
var an = ["evt"], N = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, a = Yo(i, an);
  Zt.pluginEvent.bind(b)(t, e, Y({
    dragEl: g,
    parentEl: C,
    ghostEl: w,
    rootEl: T,
    nextEl: _t,
    lastDownEl: re,
    cloneEl: D,
    cloneHidden: nt,
    dragStarted: Nt,
    putSortable: P,
    activeSortable: b.active,
    originalEvent: o,
    oldIndex: Et,
    oldDraggableIndex: Wt,
    newIndex: U,
    newDraggableIndex: it,
    hideGhostForTarget: so,
    unhideGhostForTarget: lo,
    cloneNowHidden: function() {
      nt = !0;
    },
    cloneNowShown: function() {
      nt = !1;
    },
    dispatchSortableEvent: function(s) {
      M({
        sortable: e,
        name: s,
        originalEvent: o
      });
    }
  }, a));
};
function M(n) {
  nn(Y({
    putSortable: P,
    cloneEl: D,
    targetEl: g,
    rootEl: T,
    oldIndex: Et,
    oldDraggableIndex: Wt,
    newIndex: U,
    newDraggableIndex: it
  }, n));
}
var g, C, w, T, _t, re, D, nt, Et, U, Wt, it, te, P, $t = !1, he = !1, pe = [], ft, K, Le, Ie, Ei, ki, Nt, xt, Kt, Vt = !1, ee = !1, se, R, Oe = [], qe = !1, fe = [], Se = typeof document < "u", ie = ii, Ai = Qt || J ? "cssFloat" : "float", rn = Se && !Gi && !ii && "draggable" in document.createElement("div"), no = function() {
  if (Se) {
    if (J)
      return !1;
    var n = document.createElement("x");
    return n.style.cssText = "pointer-events:auto", n.style.pointerEvents === "auto";
  }
}(), ao = function(t, e) {
  var i = v(t), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), a = Tt(t, 0, e), r = Tt(t, 1, e), s = a && v(a), l = r && v(r), c = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + I(a).width, u = l && parseInt(l.marginLeft) + parseInt(l.marginRight) + I(r).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (a && s.float && s.float !== "none") {
    var d = s.float === "left" ? "left" : "right";
    return r && (l.clear === "both" || l.clear === d) ? "vertical" : "horizontal";
  }
  return a && (s.display === "block" || s.display === "flex" || s.display === "table" || s.display === "grid" || c >= o && i[Ai] === "none" || r && i[Ai] === "none" && c + u > o) ? "vertical" : "horizontal";
}, sn = function(t, e, i) {
  var o = i ? t.left : t.top, a = i ? t.right : t.bottom, r = i ? t.width : t.height, s = i ? e.left : e.top, l = i ? e.right : e.bottom, c = i ? e.width : e.height;
  return o === s || a === l || o + r / 2 === s + c / 2;
}, ln = function(t, e) {
  var i;
  return pe.some(function(o) {
    var a = o[B].options.emptyInsertThreshold;
    if (!(!a || oi(o))) {
      var r = I(o), s = t >= r.left - a && t <= r.right + a, l = e >= r.top - a && e <= r.bottom + a;
      if (s && l)
        return i = o;
    }
  }), i;
}, ro = function(t) {
  function e(a, r) {
    return function(s, l, c, u) {
      var d = s.options.group.name && l.options.group.name && s.options.group.name === l.options.group.name;
      if (a == null && (r || d))
        return !0;
      if (a == null || a === !1)
        return !1;
      if (r && a === "clone")
        return a;
      if (typeof a == "function")
        return e(a(s, l, c, u), r)(s, l, c, u);
      var h = (r ? s : l).options.group.name;
      return a === !0 || typeof a == "string" && a === h || a.join && a.indexOf(h) > -1;
    };
  }
  var i = {}, o = t.group;
  (!o || ae(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = e(o.pull, !0), i.checkPut = e(o.put), i.revertClone = o.revertClone, t.group = i;
}, so = function() {
  !no && w && v(w, "display", "none");
}, lo = function() {
  !no && w && v(w, "display", "");
};
Se && !Gi && document.addEventListener("click", function(n) {
  if (he)
    return n.preventDefault(), n.stopPropagation && n.stopPropagation(), n.stopImmediatePropagation && n.stopImmediatePropagation(), he = !1, !1;
}, !0);
var gt = function(t) {
  if (g) {
    t = t.touches ? t.touches[0] : t;
    var e = ln(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var o in t)
        t.hasOwnProperty(o) && (i[o] = t[o]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[B]._onDragOver(i);
    }
  }
}, cn = function(t) {
  g && g.parentNode[B]._isOutsideThisEl(t.target);
};
function b(n, t) {
  if (!(n && n.nodeType && n.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(n));
  this.el = n, this.options = t = Z({}, t), n[B] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(n.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return ao(n, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(r, s) {
      r.setData("Text", s.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: b.supportPointer !== !1 && "PointerEvent" in window && (!Ht || ii),
    emptyInsertThreshold: 5
  };
  Zt.initializePlugins(this, n, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  ro(t);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : rn, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? E(n, "pointerdown", this._onTapStart) : (E(n, "mousedown", this._onTapStart), E(n, "touchstart", this._onTapStart)), this.nativeDraggable && (E(n, "dragover", this), E(n, "dragenter", this)), pe.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), Z(this, tn());
}
b.prototype = /** @lends Sortable.prototype */
{
  constructor: b,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (xt = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, g) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, o = this.options, a = o.preventOnFilter, r = t.type, s = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, l = (s || t).target, c = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || l, u = o.filter;
      if (_n(i), !g && !(/mousedown|pointerdown/.test(r) && t.button !== 0 || o.disabled) && !c.isContentEditable && !(!this.nativeDraggable && Ht && l && l.tagName.toUpperCase() === "SELECT") && (l = V(l, o.draggable, i, !1), !(l && l.animated) && re !== l)) {
        if (Et = q(l), Wt = q(l, o.draggable), typeof u == "function") {
          if (u.call(this, t, l, this)) {
            M({
              sortable: e,
              rootEl: c,
              name: "filter",
              targetEl: l,
              toEl: i,
              fromEl: i
            }), N("filter", e, {
              evt: t
            }), a && t.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(d) {
          if (d = V(c, d.trim(), i, !1), d)
            return M({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: l,
              fromEl: i,
              toEl: i
            }), N("filter", e, {
              evt: t
            }), !0;
        }), u)) {
          a && t.preventDefault();
          return;
        }
        o.handle && !V(c, o.handle, i, !1) || this._prepareDragStart(t, s, l);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var o = this, a = o.el, r = o.options, s = a.ownerDocument, l;
    if (i && !g && i.parentNode === a) {
      var c = I(i);
      if (T = a, g = i, C = g.parentNode, _t = g.nextSibling, re = i, te = r.group, b.dragged = g, ft = {
        target: g,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, Ei = ft.clientX - c.left, ki = ft.clientY - c.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, g.style["will-change"] = "all", l = function() {
        if (N("delayEnded", o, {
          evt: t
        }), b.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !wi && o.nativeDraggable && (g.draggable = !0), o._triggerDragStart(t, e), M({
          sortable: o,
          name: "choose",
          originalEvent: t
        }), z(g, r.chosenClass, !0);
      }, r.ignore.split(",").forEach(function(u) {
        Ji(g, u.trim(), Pe);
      }), E(s, "dragover", gt), E(s, "mousemove", gt), E(s, "touchmove", gt), r.supportPointer ? (E(s, "pointerup", o._onDrop), !this.nativeDraggable && E(s, "pointercancel", o._onDrop)) : (E(s, "mouseup", o._onDrop), E(s, "touchend", o._onDrop), E(s, "touchcancel", o._onDrop)), wi && this.nativeDraggable && (this.options.touchStartThreshold = 4, g.draggable = !0), N("delayStart", this, {
        evt: t
      }), r.delay && (!r.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Qt || J))) {
        if (b.eventCanceled) {
          this._onDrop();
          return;
        }
        r.supportPointer ? (E(s, "pointerup", o._disableDelayedDrag), E(s, "pointercancel", o._disableDelayedDrag)) : (E(s, "mouseup", o._disableDelayedDrag), E(s, "touchend", o._disableDelayedDrag), E(s, "touchcancel", o._disableDelayedDrag)), E(s, "mousemove", o._delayedDragTouchMoveHandler), E(s, "touchmove", o._delayedDragTouchMoveHandler), r.supportPointer && E(s, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(l, r.delay);
      } else
        l();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    g && Pe(g), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    S(t, "mouseup", this._disableDelayedDrag), S(t, "touchend", this._disableDelayedDrag), S(t, "touchcancel", this._disableDelayedDrag), S(t, "pointerup", this._disableDelayedDrag), S(t, "pointercancel", this._disableDelayedDrag), S(t, "mousemove", this._delayedDragTouchMoveHandler), S(t, "touchmove", this._delayedDragTouchMoveHandler), S(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? E(document, "pointermove", this._onTouchMove) : e ? E(document, "touchmove", this._onTouchMove) : E(document, "mousemove", this._onTouchMove) : (E(g, "dragend", this), E(T, "dragstart", this._onDragStart));
    try {
      document.selection ? le(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if ($t = !1, T && g) {
      N("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && E(document, "dragover", cn);
      var i = this.options;
      !t && z(g, i.dragClass, !1), z(g, i.ghostClass, !0), b.active = this, t && this._appendGhost(), M({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (K) {
      this._lastX = K.clientX, this._lastY = K.clientY, so();
      for (var t = document.elementFromPoint(K.clientX, K.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(K.clientX, K.clientY), t !== e); )
        e = t;
      if (g.parentNode[B]._isOutsideThisEl(t), e)
        do {
          if (e[B]) {
            var i = void 0;
            if (i = e[B]._onDragOver({
              clientX: K.clientX,
              clientY: K.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = Zi(e));
      lo();
    }
  },
  _onTouchMove: function(t) {
    if (ft) {
      var e = this.options, i = e.fallbackTolerance, o = e.fallbackOffset, a = t.touches ? t.touches[0] : t, r = w && kt(w, !0), s = w && r && r.a, l = w && r && r.d, c = ie && R && $i(R), u = (a.clientX - ft.clientX + o.x) / (s || 1) + (c ? c[0] - Oe[0] : 0) / (s || 1), d = (a.clientY - ft.clientY + o.y) / (l || 1) + (c ? c[1] - Oe[1] : 0) / (l || 1);
      if (!b.active && !$t) {
        if (i && Math.max(Math.abs(a.clientX - this._lastX), Math.abs(a.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (w) {
        r ? (r.e += u - (Le || 0), r.f += d - (Ie || 0)) : r = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: d
        };
        var h = "matrix(".concat(r.a, ",").concat(r.b, ",").concat(r.c, ",").concat(r.d, ",").concat(r.e, ",").concat(r.f, ")");
        v(w, "webkitTransform", h), v(w, "mozTransform", h), v(w, "msTransform", h), v(w, "transform", h), Le = u, Ie = d, K = a;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!w) {
      var t = this.options.fallbackOnBody ? document.body : T, e = I(g, !0, ie, !0, t), i = this.options;
      if (ie) {
        for (R = t; v(R, "position") === "static" && v(R, "transform") === "none" && R !== document; )
          R = R.parentNode;
        R !== document.body && R !== document.documentElement ? (R === document && (R = X()), e.top += R.scrollTop, e.left += R.scrollLeft) : R = X(), Oe = $i(R);
      }
      w = g.cloneNode(!0), z(w, i.ghostClass, !1), z(w, i.fallbackClass, !0), z(w, i.dragClass, !0), v(w, "transition", ""), v(w, "transform", ""), v(w, "box-sizing", "border-box"), v(w, "margin", 0), v(w, "top", e.top), v(w, "left", e.left), v(w, "width", e.width), v(w, "height", e.height), v(w, "opacity", "0.8"), v(w, "position", ie ? "absolute" : "fixed"), v(w, "zIndex", "100000"), v(w, "pointerEvents", "none"), b.ghost = w, t.appendChild(w), v(w, "transform-origin", Ei / parseInt(w.style.width) * 100 + "% " + ki / parseInt(w.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, o = t.dataTransfer, a = i.options;
    if (N("dragStart", this, {
      evt: t
    }), b.eventCanceled) {
      this._onDrop();
      return;
    }
    N("setupClone", this), b.eventCanceled || (D = io(g), D.removeAttribute("id"), D.draggable = !1, D.style["will-change"] = "", this._hideClone(), z(D, this.options.chosenClass, !1), b.clone = D), i.cloneId = le(function() {
      N("clone", i), !b.eventCanceled && (i.options.removeCloneOnHide || T.insertBefore(D, g), i._hideClone(), M({
        sortable: i,
        name: "clone"
      }));
    }), !e && z(g, a.dragClass, !0), e ? (he = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (S(document, "mouseup", i._onDrop), S(document, "touchend", i._onDrop), S(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", a.setData && a.setData.call(i, o, g)), E(document, "drop", i), v(g, "transform", "translateZ(0)")), $t = !0, i._dragStartId = le(i._dragStarted.bind(i, e, t)), E(document, "selectstart", i), Nt = !0, window.getSelection().removeAllRanges(), Ht && v(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, o, a, r, s = this.options, l = s.group, c = b.active, u = te === l, d = s.sort, h = P || c, p, f = this, m = !1;
    if (qe) return;
    function $(Pt, yo) {
      N(Pt, f, Y({
        evt: t,
        isOwner: u,
        axis: p ? "vertical" : "horizontal",
        revert: r,
        dragRect: o,
        targetRect: a,
        canSort: d,
        fromSortable: h,
        target: i,
        completed: y,
        onMove: function(si, wo) {
          return oe(T, e, g, o, si, I(si), t, wo);
        },
        changed: k
      }, yo));
    }
    function A() {
      $("dragOverAnimationCapture"), f.captureAnimationState(), f !== h && h.captureAnimationState();
    }
    function y(Pt) {
      return $("dragOverCompleted", {
        insertion: Pt
      }), Pt && (u ? c._hideClone() : c._showClone(f), f !== h && (z(g, P ? P.options.ghostClass : c.options.ghostClass, !1), z(g, s.ghostClass, !0)), P !== f && f !== b.active ? P = f : f === b.active && P && (P = null), h === f && (f._ignoreWhileAnimating = i), f.animateAll(function() {
        $("dragOverAnimationComplete"), f._ignoreWhileAnimating = null;
      }), f !== h && (h.animateAll(), h._ignoreWhileAnimating = null)), (i === g && !g.animated || i === e && !i.animated) && (xt = null), !s.dragoverBubble && !t.rootEl && i !== document && (g.parentNode[B]._isOutsideThisEl(t.target), !Pt && gt(t)), !s.dragoverBubble && t.stopPropagation && t.stopPropagation(), m = !0;
    }
    function k() {
      U = q(g), it = q(g, s.draggable), M({
        sortable: f,
        name: "change",
        toEl: e,
        newIndex: U,
        newDraggableIndex: it,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = V(i, s.draggable, e, !0), $("dragOver"), b.eventCanceled) return m;
    if (g.contains(t.target) || i.animated && i.animatingX && i.animatingY || f._ignoreWhileAnimating === i)
      return y(!1);
    if (he = !1, c && !s.disabled && (u ? d || (r = C !== T) : P === this || (this.lastPutMode = te.checkPull(this, c, g, t)) && l.checkPut(this, c, g, t))) {
      if (p = this._getDirection(t, i) === "vertical", o = I(g), $("dragOverValid"), b.eventCanceled) return m;
      if (r)
        return C = T, A(), this._hideClone(), $("revert"), b.eventCanceled || (_t ? T.insertBefore(g, _t) : T.appendChild(g)), y(!0);
      var x = oi(e, s.draggable);
      if (!x || pn(t, p, this) && !x.animated) {
        if (x === g)
          return y(!1);
        if (x && e === t.target && (i = x), i && (a = I(i)), oe(T, e, g, o, i, a, t, !!i) !== !1)
          return A(), x && x.nextSibling ? e.insertBefore(g, x.nextSibling) : e.appendChild(g), C = e, k(), y(!0);
      } else if (x && hn(t, p, this)) {
        var W = Tt(e, 0, s, !0);
        if (W === g)
          return y(!1);
        if (i = W, a = I(i), oe(T, e, g, o, i, a, t, !1) !== !1)
          return A(), e.insertBefore(g, W), C = e, k(), y(!0);
      } else if (i.parentNode === e) {
        a = I(i);
        var H = 0, dt, Ct = g.parentNode !== e, F = !sn(g.animated && g.toRect || o, i.animated && i.toRect || a, p), Lt = p ? "top" : "left", tt = Si(i, "top", "top") || Si(g, "top", "top"), It = tt ? tt.scrollTop : void 0;
        xt !== i && (dt = a[Lt], Vt = !1, ee = !F && s.invertSwap || Ct), H = fn(t, i, a, p, F ? 1 : s.swapThreshold, s.invertedSwapThreshold == null ? s.swapThreshold : s.invertedSwapThreshold, ee, xt === i);
        var G;
        if (H !== 0) {
          var ut = q(g);
          do
            ut -= H, G = C.children[ut];
          while (G && (v(G, "display") === "none" || G === w));
        }
        if (H === 0 || G === i)
          return y(!1);
        xt = i, Kt = H;
        var Ot = i.nextElementSibling, et = !1;
        et = H === 1;
        var Jt = oe(T, e, g, o, i, a, t, et);
        if (Jt !== !1)
          return (Jt === 1 || Jt === -1) && (et = Jt === 1), qe = !0, setTimeout(un, 30), A(), et && !Ot ? e.appendChild(g) : i.parentNode.insertBefore(g, et ? Ot : i), tt && eo(tt, 0, It - tt.scrollTop), C = g.parentNode, dt !== void 0 && !ee && (se = Math.abs(dt - I(i)[Lt])), k(), y(!0);
      }
      if (e.contains(g))
        return y(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    S(document, "mousemove", this._onTouchMove), S(document, "touchmove", this._onTouchMove), S(document, "pointermove", this._onTouchMove), S(document, "dragover", gt), S(document, "mousemove", gt), S(document, "touchmove", gt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    S(t, "mouseup", this._onDrop), S(t, "touchend", this._onDrop), S(t, "pointerup", this._onDrop), S(t, "pointercancel", this._onDrop), S(t, "touchcancel", this._onDrop), S(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (U = q(g), it = q(g, i.draggable), N("drop", this, {
      evt: t
    }), C = g && g.parentNode, U = q(g), it = q(g, i.draggable), b.eventCanceled) {
      this._nulling();
      return;
    }
    $t = !1, ee = !1, Vt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), We(this.cloneId), We(this._dragStartId), this.nativeDraggable && (S(document, "drop", this), S(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Ht && v(document.body, "user-select", ""), v(g, "transform", ""), t && (Nt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), w && w.parentNode && w.parentNode.removeChild(w), (T === C || P && P.lastPutMode !== "clone") && D && D.parentNode && D.parentNode.removeChild(D), g && (this.nativeDraggable && S(g, "dragend", this), Pe(g), g.style["will-change"] = "", Nt && !$t && z(g, P ? P.options.ghostClass : this.options.ghostClass, !1), z(g, this.options.chosenClass, !1), M({
      sortable: this,
      name: "unchoose",
      toEl: C,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), T !== C ? (U >= 0 && (M({
      rootEl: C,
      name: "add",
      toEl: C,
      fromEl: T,
      originalEvent: t
    }), M({
      sortable: this,
      name: "remove",
      toEl: C,
      originalEvent: t
    }), M({
      rootEl: C,
      name: "sort",
      toEl: C,
      fromEl: T,
      originalEvent: t
    }), M({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), P && P.save()) : U !== Et && U >= 0 && (M({
      sortable: this,
      name: "update",
      toEl: C,
      originalEvent: t
    }), M({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), b.active && ((U == null || U === -1) && (U = Et, it = Wt), M({
      sortable: this,
      name: "end",
      toEl: C,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    N("nulling", this), T = g = C = w = _t = D = re = nt = ft = K = Nt = U = it = Et = Wt = xt = Kt = P = te = b.dragged = b.ghost = b.clone = b.active = null, fe.forEach(function(t) {
      t.checked = !0;
    }), fe.length = Le = Ie = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        g && (this._onDragOver(t), dn(t));
        break;
      case "selectstart":
        t.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var t = [], e, i = this.el.children, o = 0, a = i.length, r = this.options; o < a; o++)
      e = i[o], V(e, r.draggable, this.el, !1) && t.push(e.getAttribute(r.dataIdAttr) || mn(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(a, r) {
      var s = o.children[r];
      V(s, this.options.draggable, o, !1) && (i[a] = s);
    }, this), e && this.captureAnimationState(), t.forEach(function(a) {
      i[a] && (o.removeChild(i[a]), o.appendChild(i[a]));
    }), e && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var t = this.options.store;
    t && t.set && t.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(t, e) {
    return V(t, e || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(t, e) {
    var i = this.options;
    if (e === void 0)
      return i[t];
    var o = Zt.modifyOption(this, t, e);
    typeof o < "u" ? i[t] = o : i[t] = e, t === "group" && ro(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    N("destroy", this);
    var t = this.el;
    t[B] = null, S(t, "mousedown", this._onTapStart), S(t, "touchstart", this._onTapStart), S(t, "pointerdown", this._onTapStart), this.nativeDraggable && (S(t, "dragover", this), S(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), pe.splice(pe.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!nt) {
      if (N("hideClone", this), b.eventCanceled) return;
      v(D, "display", "none"), this.options.removeCloneOnHide && D.parentNode && D.parentNode.removeChild(D), nt = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (nt) {
      if (N("showClone", this), b.eventCanceled) return;
      g.parentNode == T && !this.options.group.revertClone ? T.insertBefore(D, g) : _t ? T.insertBefore(D, _t) : T.appendChild(D), this.options.group.revertClone && this.animate(g, D), v(D, "display", ""), nt = !1;
    }
  }
};
function dn(n) {
  n.dataTransfer && (n.dataTransfer.dropEffect = "move"), n.cancelable && n.preventDefault();
}
function oe(n, t, e, i, o, a, r, s) {
  var l, c = n[B], u = c.options.onMove, d;
  return window.CustomEvent && !J && !Qt ? l = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (l = document.createEvent("Event"), l.initEvent("move", !0, !0)), l.to = t, l.from = n, l.dragged = e, l.draggedRect = i, l.related = o || t, l.relatedRect = a || I(t), l.willInsertAfter = s, l.originalEvent = r, n.dispatchEvent(l), u && (d = u.call(c, l, r)), d;
}
function Pe(n) {
  n.draggable = !1;
}
function un() {
  qe = !1;
}
function hn(n, t, e) {
  var i = I(Tt(e.el, 0, e.options, !0)), o = oo(e.el, e.options, w), a = 10;
  return t ? n.clientX < o.left - a || n.clientY < i.top && n.clientX < i.right : n.clientY < o.top - a || n.clientY < i.bottom && n.clientX < i.left;
}
function pn(n, t, e) {
  var i = I(oi(e.el, e.options.draggable)), o = oo(e.el, e.options, w), a = 10;
  return t ? n.clientX > o.right + a || n.clientY > i.bottom && n.clientX > i.left : n.clientY > o.bottom + a || n.clientX > i.right && n.clientY > i.top;
}
function fn(n, t, e, i, o, a, r, s) {
  var l = i ? n.clientY : n.clientX, c = i ? e.height : e.width, u = i ? e.top : e.left, d = i ? e.bottom : e.right, h = !1;
  if (!r) {
    if (s && se < c * o) {
      if (!Vt && (Kt === 1 ? l > u + c * a / 2 : l < d - c * a / 2) && (Vt = !0), Vt)
        h = !0;
      else if (Kt === 1 ? l < u + se : l > d - se)
        return -Kt;
    } else if (l > u + c * (1 - o) / 2 && l < d - c * (1 - o) / 2)
      return gn(t);
  }
  return h = h || r, h && (l < u + c * a / 2 || l > d - c * a / 2) ? l > u + c / 2 ? 1 : -1 : 0;
}
function gn(n) {
  return q(g) < q(n) ? 1 : -1;
}
function mn(n) {
  for (var t = n.tagName + n.className + n.src + n.href + n.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function _n(n) {
  fe.length = 0;
  for (var t = n.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && fe.push(i);
  }
}
function le(n) {
  return setTimeout(n, 0);
}
function We(n) {
  return clearTimeout(n);
}
Se && E(document, "touchmove", function(n) {
  (b.active || $t) && n.cancelable && n.preventDefault();
});
b.utils = {
  on: E,
  off: S,
  css: v,
  find: Ji,
  is: function(t, e) {
    return !!V(t, e, t, !1);
  },
  extend: Zo,
  throttle: to,
  closest: V,
  toggleClass: z,
  clone: io,
  index: q,
  nextTick: le,
  cancelNextTick: We,
  detectDirection: ao,
  getChild: Tt,
  expando: B
};
b.get = function(n) {
  return n[B];
};
b.mount = function() {
  for (var n = arguments.length, t = new Array(n), e = 0; e < n; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (b.utils = Y(Y({}, b.utils), i.utils)), Zt.mount(i);
  });
};
b.create = function(n, t) {
  return new b(n, t);
};
b.version = Go;
var L = [], Bt, Ke, Ve = !1, Re, Me, ge, Ft;
function vn() {
  function n() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var t in this)
      t.charAt(0) === "_" && typeof this[t] == "function" && (this[t] = this[t].bind(this));
  }
  return n.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? E(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? E(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? E(document, "touchmove", this._handleFallbackAutoScroll) : E(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? S(document, "dragover", this._handleAutoScroll) : (S(document, "pointermove", this._handleFallbackAutoScroll), S(document, "touchmove", this._handleFallbackAutoScroll), S(document, "mousemove", this._handleFallbackAutoScroll)), Ti(), ce(), Jo();
    },
    nulling: function() {
      ge = Ke = Bt = Ve = Ft = Re = Me = null, L.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var o = this, a = (e.touches ? e.touches[0] : e).clientX, r = (e.touches ? e.touches[0] : e).clientY, s = document.elementFromPoint(a, r);
      if (ge = e, i || this.options.forceAutoScrollFallback || Qt || J || Ht) {
        Ne(e, this.options, s, i);
        var l = rt(s, !0);
        Ve && (!Ft || a !== Re || r !== Me) && (Ft && Ti(), Ft = setInterval(function() {
          var c = rt(document.elementFromPoint(a, r), !0);
          c !== l && (l = c, ce()), Ne(e, o.options, c, i);
        }, 10), Re = a, Me = r);
      } else {
        if (!this.options.bubbleScroll || rt(s, !0) === X()) {
          ce();
          return;
        }
        Ne(e, this.options, rt(s, !1), !1);
      }
    }
  }, Z(n, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function ce() {
  L.forEach(function(n) {
    clearInterval(n.pid);
  }), L = [];
}
function Ti() {
  clearInterval(Ft);
}
var Ne = to(function(n, t, e, i) {
  if (t.scroll) {
    var o = (n.touches ? n.touches[0] : n).clientX, a = (n.touches ? n.touches[0] : n).clientY, r = t.scrollSensitivity, s = t.scrollSpeed, l = X(), c = !1, u;
    Ke !== e && (Ke = e, ce(), Bt = t.scroll, u = t.scrollFn, Bt === !0 && (Bt = rt(e, !0)));
    var d = 0, h = Bt;
    do {
      var p = h, f = I(p), m = f.top, $ = f.bottom, A = f.left, y = f.right, k = f.width, x = f.height, W = void 0, H = void 0, dt = p.scrollWidth, Ct = p.scrollHeight, F = v(p), Lt = p.scrollLeft, tt = p.scrollTop;
      p === l ? (W = k < dt && (F.overflowX === "auto" || F.overflowX === "scroll" || F.overflowX === "visible"), H = x < Ct && (F.overflowY === "auto" || F.overflowY === "scroll" || F.overflowY === "visible")) : (W = k < dt && (F.overflowX === "auto" || F.overflowX === "scroll"), H = x < Ct && (F.overflowY === "auto" || F.overflowY === "scroll"));
      var It = W && (Math.abs(y - o) <= r && Lt + k < dt) - (Math.abs(A - o) <= r && !!Lt), G = H && (Math.abs($ - a) <= r && tt + x < Ct) - (Math.abs(m - a) <= r && !!tt);
      if (!L[d])
        for (var ut = 0; ut <= d; ut++)
          L[ut] || (L[ut] = {});
      (L[d].vx != It || L[d].vy != G || L[d].el !== p) && (L[d].el = p, L[d].vx = It, L[d].vy = G, clearInterval(L[d].pid), (It != 0 || G != 0) && (c = !0, L[d].pid = setInterval((function() {
        i && this.layer === 0 && b.active._onTouchMove(ge);
        var Ot = L[this.layer].vy ? L[this.layer].vy * s : 0, et = L[this.layer].vx ? L[this.layer].vx * s : 0;
        typeof u == "function" && u.call(b.dragged.parentNode[B], et, Ot, n, ge, L[this.layer].el) !== "continue" || eo(L[this.layer].el, et, Ot);
      }).bind({
        layer: d
      }), 24))), d++;
    } while (t.bubbleScroll && h !== l && (h = rt(h, !1)));
    Ve = c;
  }
}, 30), co = function(t) {
  var e = t.originalEvent, i = t.putSortable, o = t.dragEl, a = t.activeSortable, r = t.dispatchSortableEvent, s = t.hideGhostForTarget, l = t.unhideGhostForTarget;
  if (e) {
    var c = i || a;
    s();
    var u = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, d = document.elementFromPoint(u.clientX, u.clientY);
    l(), c && !c.el.contains(d) && (r("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function ni() {
}
ni.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var o = Tt(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(e, o) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: co
};
Z(ni, {
  pluginName: "revertOnSpill"
});
function ai() {
}
ai.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, o = i || this.sortable;
    o.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), o.animateAll();
  },
  drop: co
};
Z(ai, {
  pluginName: "removeOnSpill"
});
b.mount(new vn());
b.mount(ai, ni);
const bn = {
  room: "area"
}, uo = /* @__PURE__ */ new Set(["building", "grounds"]);
function yn(n) {
  const t = String(n ?? "area").trim().toLowerCase(), e = bn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function ct(n) {
  var t, e;
  return yn((e = (t = n.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function je(n) {
  return n === "floor" ? ["root", "building"] : uo.has(n) ? ["root"] : n === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function wn(n, t) {
  return je(n).includes(t);
}
function Di(n) {
  var c;
  const { locations: t, locationId: e, newParentId: i } = n;
  if (i === e || i && Xe(t, e, i)) return !1;
  const o = new Map(t.map((u) => [u.id, u])), a = o.get(e);
  if (!a || i && !o.get(i) || i && ((c = o.get(i)) != null && c.is_explicit_root) || t.some((u) => u.parent_id === a.id) && i !== a.parent_id) return !1;
  const s = ct(a);
  if (uo.has(s))
    return i === null;
  const l = i === null ? "root" : ct(o.get(i) ?? {});
  return !!wn(s, l);
}
function Xe(n, t, e) {
  if (t === e) return !1;
  const i = new Map(n.map((r) => [r.id, r]));
  let o = i.get(e);
  const a = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === t || a.has(o.parent_id)) return !0;
    a.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
function xn(n) {
  const t = n.toLowerCase(), e = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"]
  }, i = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater"
  };
  for (const [o, a] of Object.entries(e))
    if (a.some((r) => t.includes(r)))
      return i[o] ?? null;
  return null;
}
function ho(n) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[n] ?? "mdi:map-marker";
}
function Sn(n) {
  const t = String(n ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function $n(n) {
  var o;
  const t = (o = n.modules) == null ? void 0 : o._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = xn(n.name);
  if (e) return e;
  const i = Sn(t == null ? void 0 : t.type);
  return ho(i);
}
const po = 28, fo = 14, En = 400;
function Ci(n, t) {
  const e = /* @__PURE__ */ new Map();
  for (const a of n) {
    const r = a.parent_id;
    e.has(r) || e.set(r, []), e.get(r).push(a);
  }
  const i = [];
  function o(a, r) {
    const s = e.get(a) || [];
    for (const l of s) {
      const u = (e.get(l.id) || []).length > 0, d = t.has(l.id);
      i.push({ location: l, depth: r, hasChildren: u, isExpanded: d }), d && u && o(l.id, r + 1);
    }
  }
  return o(null, 0), i;
}
function kn(n, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of n) {
      const a = o.location.parent_id;
      a && e.has(a) && !e.has(o.location.id) && (e.add(o.location.id), i = !0);
    }
  }
  return e;
}
function An(n, t, e, i, o, a) {
  const r = kn(n, t), s = n.filter((y) => !r.has(y.location.id));
  let l = o;
  const c = n.find((y) => y.location.id === t), u = c ? ct(c.location) : "area", d = a != null && a.relatedId ? s.find((y) => y.location.id === a.relatedId) : void 0, h = (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0, p = h ? a.pointerX >= a.relatedLeft + po : !1, f = h ? a.pointerX <= a.relatedLeft - fo : !1;
  if (d) {
    const y = ct(d.location);
    p ? l = u === "floor" && y !== "building" ? d.location.parent_id : d.location.id : d.location.id === o ? l = f ? d.location.parent_id : o : l = d.location.parent_id;
  }
  const m = s.filter((y) => y.location.parent_id === l);
  if (d) {
    if (l === d.location.id)
      return { parentId: l, siblingIndex: m.length };
    if (d.location.id === o && l === o)
      return { parentId: l, siblingIndex: a != null && a.willInsertAfter ? m.length : 0 };
    const y = m.findIndex(
      (k) => k.location.id === d.location.id
    );
    if (y >= 0) {
      const k = a != null && a.willInsertAfter ? y + 1 : y;
      return { parentId: l, siblingIndex: Math.max(0, Math.min(k, m.length)) };
    }
  }
  const $ = Math.max(
    0,
    Math.min(
      i > e ? i - r.size : i,
      s.length
    )
  ), A = s.slice(0, $).filter((y) => y.location.parent_id === l).length;
  return { parentId: l, siblingIndex: A };
}
const _e = class _e extends lt {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var r;
    const e = ((r = t.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const o = i.getAttribute("data-id") || void 0;
    if (o && o !== e && !Xe(this.locations, e, o))
      return o;
    let a = i;
    for (; a; ) {
      if (a.classList.contains("tree-item")) {
        const s = a.getAttribute("data-id") || void 0;
        if (s && s !== e && !Xe(this.locations, e, s))
          return s;
      }
      a = t.willInsertAfter ? a.nextElementSibling : a.previousElementSibling;
    }
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._sortable) == null || t.destroy(), this._sortable = void 0, this._clearDragHoverExpand();
  }
  updated(t) {
    super.updated(t), (t.has("locations") || t.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const t = /* @__PURE__ */ new Set();
    for (const e of this.locations)
      e.parent_id && t.add(e.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = /* @__PURE__ */ new Set(), this._hasInitializedExpansion = !0;
    else {
      const e = /* @__PURE__ */ new Set();
      for (const i of this._expandedIds)
        t.has(i) && e.add(i);
      this._expandedIds = e;
    }
  }
  _initializeSortable() {
    var t;
    (t = this._sortable) == null || t.destroy(), this.updateComplete.then(() => {
      var i;
      const e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      e && (this._sortable = b.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: () => {
          this._isDragging = !0, this._dropIndicator = void 0, this._clearDragHoverExpand();
        },
        onMove: (o) => {
          var s, l, c;
          const a = ((s = o.dragged) == null ? void 0 : s.getAttribute("data-id")) || void 0, r = o.related;
          if (a && (r != null && r.classList.contains("tree-item"))) {
            const u = this._resolveRelatedId(o), d = (u ? (l = this.shadowRoot) == null ? void 0 : l.querySelector(
              `.tree-item[data-id="${u}"]`
            ) : null) || r, h = d.getBoundingClientRect();
            this._lastDropContext = {
              relatedId: u ?? r.getAttribute("data-id") ?? void 0,
              willInsertAfter: o.willInsertAfter,
              pointerX: (c = o.originalEvent) == null ? void 0 : c.clientX,
              relatedLeft: h.left
            }, this._updateDropIndicator(a, this._lastDropContext, d), this._scheduleDragHoverExpand(a, this._lastDropContext);
          } else
            this._dropIndicator = void 0, this._clearDragHoverExpand();
          return !0;
        },
        onEnd: (o) => {
          this._isDragging = !1, this._dropIndicator = void 0, this._clearDragHoverExpand(), this._handleDragEnd(o), this._lastDropContext = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    const { item: e, newIndex: i, oldIndex: o } = t;
    if (i === void 0 || o === void 0) return;
    const a = e.getAttribute("data-id");
    if (!a) return;
    const r = this.locations.find((p) => p.id === a);
    if (!r) return;
    const s = this._lastDropContext, l = Ci(this.locations, this._expandedIds), c = An(
      l,
      a,
      o,
      i,
      r.parent_id,
      s
    ), u = c.parentId, d = c.siblingIndex, h = l.slice(0, o).filter((p) => p.location.parent_id === r.parent_id).length;
    if (u === r.parent_id && d === h) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!Di({ locations: this.locations, locationId: a, newParentId: u })) {
      this.locations.some((f) => f.parent_id === a) && u !== r.parent_id && this.dispatchEvent(
        new CustomEvent("location-move-blocked", {
          detail: {
            reason: "Parent locations cannot move under a different parent. Reorder it within the current level."
          },
          bubbles: !0,
          composed: !0
        })
      ), this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: a, newParentId: u, newIndex: d },
      bubbles: !0,
      composed: !0
    }));
  }
  _restoreTreeAfterCancelledDrop() {
    this._dropIndicator = void 0, this._clearDragHoverExpand(), this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _clearDragHoverExpand() {
    this._dragHoverExpandTimer !== void 0 && (window.clearTimeout(this._dragHoverExpandTimer), this._dragHoverExpandTimer = void 0), this._dragHoverExpandTargetId = void 0;
  }
  _scheduleDragHoverExpand(t, e) {
    const i = e == null ? void 0 : e.relatedId;
    if (!i) {
      this._clearDragHoverExpand();
      return;
    }
    if (this._resolveDropIntent(t, e) !== "child") {
      this._clearDragHoverExpand();
      return;
    }
    if (!this.locations.some((r) => r.parent_id === i) || this._expandedIds.has(i)) {
      this._clearDragHoverExpand();
      return;
    }
    if (!Di({
      locations: this.locations,
      locationId: t,
      newParentId: i
    })) {
      this._clearDragHoverExpand();
      return;
    }
    this._dragHoverExpandTargetId === i && this._dragHoverExpandTimer !== void 0 || (this._clearDragHoverExpand(), this._dragHoverExpandTargetId = i, this._dragHoverExpandTimer = window.setTimeout(() => {
      this._dragHoverExpandTimer = void 0;
      const r = this._dragHoverExpandTargetId;
      if (!this._isDragging || !r || this._expandedIds.has(r))
        return;
      const s = new Set(this._expandedIds);
      s.add(r), this._expandedIds = s;
    }, En));
  }
  _resolveDropIntent(t, e) {
    if (e.pointerX === void 0 || e.relatedLeft === void 0)
      return "sibling";
    if (e.pointerX >= e.relatedLeft + po)
      return "child";
    const i = this.locations.find((o) => o.id === t);
    return i && i.parent_id && e.relatedId === i.parent_id && e.pointerX <= e.relatedLeft - fo ? "outdent" : "sibling";
  }
  _updateDropIndicator(t, e, i) {
    var h;
    const o = (h = this.shadowRoot) == null ? void 0 : h.querySelector(".tree-list");
    if (!e || !i || !o) {
      this._dropIndicator = void 0;
      return;
    }
    const a = o.getBoundingClientRect(), r = i.getBoundingClientRect(), s = this._resolveDropIntent(t, e);
    let l = r.left - a.left + 6;
    s === "child" && (l += 24), s === "outdent" && (l -= 24), l = Math.max(8, Math.min(l, a.width - 44));
    const c = Math.max(36, a.width - l - 8), u = (e.willInsertAfter ? r.bottom : r.top) - a.top, d = s === "child" ? "Child" : s === "outdent" ? "Outdent" : e.willInsertAfter ? "After" : "Before";
    this._dropIndicator = { top: u, left: l, width: c, intent: s, label: d };
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const a of e) {
      const r = a.getAttribute("data-id");
      if (r) {
        if (i.has(r)) {
          a.remove();
          continue;
        }
        i.add(r);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return _`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? _`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : _`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Ci(this.locations, this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return _`
      <div class="tree-list">
        ${Vo(
      t,
      (o) => `${this.version}:${o.location.id}:${o.depth}`,
      (o) => this._renderItem(
        o,
        e[o.location.id] || "unknown",
        i[o.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? _`
              <div
                class="drop-indicator ${this._dropIndicator.intent}"
                style=${`top:${this._dropIndicator.top}px;left:${this._dropIndicator.left}px;width:${this._dropIndicator.width}px;`}
              >
                <div class="drop-indicator-line"></div>
                <div class="drop-indicator-label">${this._dropIndicator.label}</div>
              </div>
            ` : ""}
      </div>
    `;
  }
  _renderItem(t, e, i) {
    var k;
    const { location: o, depth: a, hasChildren: r, isExpanded: s } = t, l = this.selectedId === o.id, c = this._editingId === o.id, u = a * 24, d = ct(o), h = o.is_explicit_root ? "root" : d, p = o.is_explicit_root ? "home root" : d, f = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", m = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", $ = ((k = this.occupancyStates) == null ? void 0 : k[o.id]) === !0, A = "mdi:home-switch-outline", y = $ ? "Set vacant" : "Set occupied";
    return _`
      <div
        class="tree-item ${l ? "selected" : ""} ${d === "floor" ? "floor-item" : ""}"
        data-id=${o.id}
        style="margin-left: ${u}px"
        @click=${(x) => this._handleClick(x, o)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder. Move right to nest under a row." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${s ? "expanded" : ""} ${r ? "" : "hidden"}"
          @click=${(x) => this._handleExpand(x, o.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(o)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${e}"
          title=${this._getOccupancyStatusLabel(e)}
        ></div>

        ${c ? _`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(x) => this._editingValue = x.target.value}
                  @blur=${() => this._finishEditing(o.id)}
                  @keydown=${(x) => this._handleEditKeydown(x, o.id)}
                  @click=${(x) => x.stopPropagation()} />` : _`<div
              class="location-name"
              @dblclick=${this.allowRename ? (x) => this._startEditing(x, o) : () => {
    }}
            >${o.name}</div>`}

        <span class="type-badge ${h}">${p}</span>

        ${o.is_explicit_root || this.readOnly ? "" : _`
              <button
                class="occupancy-btn"
                title=${y}
                @click=${(x) => this._handleOccupancyToggle(x, o, $)}
              >
                <ha-icon .icon=${A}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${m}
                @click=${(x) => this._handleLockToggle(x, o, i)}
              >
                <ha-icon .icon=${f}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((r) => [r.id, r])), i = /* @__PURE__ */ new Map();
    for (const r of this.locations)
      r.parent_id && (i.has(r.parent_id) || i.set(r.parent_id, []), i.get(r.parent_id).push(r.id));
    const o = /* @__PURE__ */ new Map(), a = (r) => {
      var p;
      const s = o.get(r);
      if (s) return s;
      if (!e.has(r)) return "unknown";
      const l = (p = this.occupancyStates) == null ? void 0 : p[r], c = l === !0 ? "occupied" : l === !1 ? "vacant" : "unknown", u = i.get(r) || [];
      if (!u.length)
        return o.set(r, c), c;
      const d = u.map((f) => a(f));
      let h;
      return c === "occupied" || d.includes("occupied") ? h = "occupied" : c === "vacant" || d.length > 0 && d.every((f) => f === "vacant") ? h = "vacant" : h = "unknown", o.set(r, h), h;
    };
    for (const r of this.locations)
      t[r.id] = a(r.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const o of Object.values(t)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if (a.device_class !== "occupancy") continue;
      const r = a.location_id;
      if (!r) continue;
      const s = a.locked_by;
      e[String(r)] = {
        isLocked: !!a.is_locked,
        lockedBy: Array.isArray(s) ? s.map((l) => String(l)) : []
      };
    }
    return e;
  }
  _getIcon(t) {
    var i, o, a;
    if (t.ha_area_id && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[t.ha_area_id]) != null && a.icon))
      return this.hass.areas[t.ha_area_id].icon;
    const e = ct(t);
    return ho(e);
  }
  _handleClick(t, e) {
    const i = t.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".lock-btn") || i.closest(".occupancy-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: e.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(t, e) {
    t.stopPropagation();
    const i = new Set(this._expandedIds);
    i.has(e) ? i.delete(e) : i.add(e), this._expandedIds = i;
  }
  _startEditing(t, e) {
    this.allowRename && (t.stopPropagation(), this._editingId = e.id, this._editingValue = e.name, this.updateComplete.then(() => {
      var o;
      const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    }));
  }
  _handleEditKeydown(t, e) {
    t.key === "Enter" ? (t.preventDefault(), this._finishEditing(e)) : t.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(t) {
    var i;
    if (this._editingId !== t) return;
    const e = this._editingValue.trim();
    this._editingId = void 0, !(!e || e === ((i = this.locations.find((o) => o.id === t)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: t, newName: e }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(t, e) {
    this.readOnly || e.is_explicit_root || (t.stopPropagation(), confirm(`Delete "${e.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: e }, bubbles: !0, composed: !0 })));
  }
  _handleCreate() {
    this.readOnly || this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
  _handleLockToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: {
          locationId: e.id,
          lock: !i.isLocked
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOccupancyToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: {
          locationId: e.id,
          occupied: !i
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOpenSettings(t) {
    var i;
    t.preventDefault();
    const e = (i = this.hass) == null ? void 0 : i.navigate;
    typeof e == "function" ? e("/config/areas") : window.location.href = "/config/areas";
  }
};
_e.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  occupancyStates: { attribute: !1 },
  readOnly: { type: Boolean },
  allowMove: { type: Boolean },
  allowRename: { type: Boolean },
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 },
  _dropIndicator: { state: !0 }
}, _e.styles = [
  xe,
  Gt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        position: relative;
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .drop-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 5;
      }

      .drop-indicator-line {
        height: 2px;
        width: 100%;
        border-radius: 999px;
        background: var(--primary-color);
        box-shadow: 0 0 0 1px rgba(var(--rgb-primary-color), 0.18);
      }

      .drop-indicator::before {
        content: "";
        position: absolute;
        left: -6px;
        top: -4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
      }

      .drop-indicator-label {
        position: absolute;
        top: -18px;
        left: 0;
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--card-background-color);
        background: rgba(var(--rgb-primary-color), 0.95);
        white-space: nowrap;
      }

      .drop-indicator.sibling .drop-indicator-label {
        background: rgba(var(--rgb-primary-color), 0.95);
      }

      .drop-indicator.child .drop-indicator-label {
        background: rgba(var(--rgb-success-color), 0.95);
      }

      .drop-indicator.outdent .drop-indicator-label {
        background: rgba(var(--rgb-warning-color), 0.95);
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .type-badge.building {
        background: rgba(var(--rgb-success-color), 0.15);
        color: var(--success-color);
      }

      .type-badge.grounds {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .tree-item.selected .type-badge.building {
        background: var(--success-color);
        color: white;
      }

      .tree-item.selected .type-badge.grounds {
        background: var(--info-color);
        color: white;
      }

      .type-badge.root {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.root {
        background: var(--info-color);
        color: white;
      }

      .delete-btn {
        opacity: 0.6;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 1;
      }

      .tree-item.selected .delete-btn {
        opacity: 1;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .lock-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .lock-btn,
      .tree-item.selected .lock-btn {
        opacity: 1;
      }

      .lock-btn.locked {
        color: var(--warning-color);
      }

      .lock-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .occupancy-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .occupancy-btn,
      .tree-item.selected .occupancy-btn {
        opacity: 1;
      }

      .occupancy-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `
];
let Ye = _e;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Ye);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Tn = ji(class extends Xi {
  constructor(n) {
    if (super(n), n.type !== mt.PROPERTY && n.type !== mt.ATTRIBUTE && n.type !== mt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!qo(n)) throw Error("`live` bindings can only contain a single expression");
  }
  render(n) {
    return n;
  }
  update(n, [t]) {
    if (t === j || t === O) return t;
    const e = n.element, i = n.name;
    if (n.type === mt.PROPERTY) {
      if (t === e[i]) return j;
    } else if (n.type === mt.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return j;
    } else if (n.type === mt.ATTRIBUTE && e.getAttribute(i) === t + "") return j;
    return Yi(n), t;
  }
}), at = 30 * 60, Li = 5 * 60;
function go(n) {
  if (!n) return "";
  const t = n.indexOf(".");
  return t >= 0 ? n.slice(0, t) : "";
}
function Dn(n) {
  return ["door", "garage_door", "opening", "window"].includes(n || "");
}
function Cn(n) {
  return ["presence", "occupancy"].includes(n || "");
}
function Ln(n) {
  return n === "motion";
}
function mo(n) {
  return n === "media_player";
}
function _o(n) {
  var i;
  const t = go(n == null ? void 0 : n.entity_id), e = (i = n == null ? void 0 : n.attributes) == null ? void 0 : i.device_class;
  if (mo(t))
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: at,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: at,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Li
    };
  if (t === "binary_sensor") {
    if (Cn(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Li
      };
    if (Ln(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: at,
        off_event: "none",
        off_trailing: 0
      };
    if (Dn(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: at,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (n == null ? void 0 : n.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: at,
    off_event: "none",
    off_trailing: 0
  };
}
function In(n, t, e) {
  const i = go(e == null ? void 0 : e.entity_id), o = _o(e);
  if (mo(i)) {
    const r = n.on_timeout && n.on_timeout > 0 ? n.on_timeout : at;
    return {
      ...n,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const r = n.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : at);
    return {
      ...n,
      mode: t,
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  const a = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: at,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...n,
    mode: t,
    on_event: n.on_event ?? a.on_event,
    on_timeout: n.on_timeout ?? a.on_timeout,
    off_event: n.off_event ?? a.off_event,
    off_trailing: n.off_trailing ?? a.off_trailing
  };
}
const vo = "topomation_", Be = "[topomation]", On = "topomation/actions/rules/list", Pn = "topomation/actions/rules/create", Rn = "topomation/actions/rules/delete";
function Mn(n) {
  if (!n || typeof n != "object") return;
  const t = n;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function ri(n) {
  const t = Mn(n);
  if (t && ["unknown_command", "not_found", "invalid_format", "unknown_error"].includes(t))
    return !0;
  const e = bo(n).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function me(n) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${n}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function Nn(n) {
  if (typeof n != "string" || !n.includes(Be))
    return null;
  const t = n.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(Be)) continue;
    const i = e.slice(Be.length).trim();
    if (!i) return null;
    try {
      const o = JSON.parse(i);
      if (typeof (o == null ? void 0 : o.location_id) == "string" && ((o == null ? void 0 : o.trigger_type) === "occupied" || (o == null ? void 0 : o.trigger_type) === "vacant"))
        return {
          version: Number(o.version) || 1,
          location_id: o.location_id,
          trigger_type: o.trigger_type,
          require_dark: typeof o.require_dark == "boolean" ? o.require_dark : void 0
        };
    } catch {
      return null;
    }
  }
  return null;
}
function Bn(n) {
  var s, l;
  const t = (n == null ? void 0 : n.actions) ?? (n == null ? void 0 : n.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", o = i.includes(".") ? i.split(".").slice(1).join(".") : i, a = (s = e == null ? void 0 : e.target) == null ? void 0 : s.entity_id;
  if (typeof a == "string")
    return {
      action_entity_id: a,
      action_service: o || void 0
    };
  if (Array.isArray(a) && typeof a[0] == "string")
    return {
      action_entity_id: a[0],
      action_service: o || void 0
    };
  const r = (l = e == null ? void 0 : e.data) == null ? void 0 : l.entity_id;
  return typeof r == "string" ? {
    action_entity_id: r,
    action_service: o || void 0
  } : {
    action_service: o || void 0
  };
}
function Fn(n) {
  const t = (n == null ? void 0 : n.conditions) ?? (n == null ? void 0 : n.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
  for (; e.length > 0; ) {
    const i = e.pop();
    if (!i || typeof i != "object") continue;
    if (i.condition === "state" && i.entity_id === "sun.sun" && i.state === "below_horizon")
      return !0;
    const o = i.conditions;
    Array.isArray(o) && e.push(...o);
  }
  return !1;
}
async function zn(n) {
  try {
    const t = await n.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? {
      entries: t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation"),
      usedStateFallback: !1
    } : {
      entries: [],
      usedStateFallback: !1
    };
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), {
      entries: Object.keys(n.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e })),
      usedStateFallback: !0
    };
  }
}
function Un(n, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof n.unique_id == "string" ? n.unique_id.trim() : "";
  if (i) return i;
}
function Hn(n) {
  return !!((typeof n.unique_id == "string" ? n.unique_id.trim().toLowerCase() : "").startsWith(vo) || (Array.isArray(n.labels) ? n.labels : []).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ) || Object.values(n.categories || {}).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ));
}
function qn(n) {
  return Object.entries(n.states || {}).some(([t, e]) => {
    var o;
    if (!t.startsWith("automation.")) return !1;
    const i = (o = e == null ? void 0 : e.attributes) == null ? void 0 : o.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(vo);
  });
}
function bo(n) {
  if (typeof n == "string" && n.trim()) return n.trim();
  if (n instanceof Error && n.message.trim()) return n.message.trim();
  if (n && typeof n == "object" && "message" in n) {
    const t = n.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function Wn(n, t) {
  const i = (await zn(n)).entries, o = i.filter(Hn), a = o.length > 0 ? o : i, r = [], l = (await Promise.all(
    a.map(async (d) => {
      var h, p;
      if (d.entity_id)
        try {
          const f = await n.callWS({
            type: "automation/config",
            entity_id: d.entity_id
          }), m = f == null ? void 0 : f.config;
          if (!m || typeof m != "object")
            return;
          const $ = Nn(m.description);
          if (!$ || $.location_id !== t)
            return;
          const A = Un(d, m), y = Bn(m), k = (h = n.states) == null ? void 0 : h[d.entity_id], x = k ? k.state !== "off" : !0, W = typeof m.alias == "string" && m.alias.trim() || ((p = k == null ? void 0 : k.attributes) == null ? void 0 : p.friendly_name) || d.entity_id;
          return {
            id: A || d.entity_id,
            entity_id: d.entity_id,
            name: W,
            trigger_type: $.trigger_type,
            action_entity_id: y.action_entity_id,
            action_service: y.action_service,
            require_dark: typeof $.require_dark == "boolean" ? $.require_dark : Fn(m),
            enabled: x
          };
        } catch (f) {
          r.push({
            entity_id: d.entity_id,
            error: f
          }), console.debug("[ha-automation-rules] failed to read automation config", d.entity_id, f);
          return;
        }
    })
  )).filter((d) => !!d).sort((d, h) => d.name.localeCompare(h.name)), c = a.length > 0 && r.length === a.length, u = o.length > 0 || qn(n);
  if (l.length === 0 && c && u) {
    const d = r[0], h = d ? bo(d.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${h}`);
  }
  return l;
}
async function Kn(n, t, e) {
  try {
    const i = await n.callWS({
      type: On,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return [...i.rules].sort((o, a) => o.name.localeCompare(a.name));
  } catch (i) {
    if (!ri(i))
      throw i;
  }
  return Wn(n, t);
}
async function Vn(n, t, e) {
  try {
    const i = await n.callWS({
      type: Pn,
      location_id: t.location.id,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service,
      require_dark: !!t.require_dark,
      ...e ? { entry_id: e } : {}
    });
    if (i != null && i.rule)
      return {
        ...i.rule,
        require_dark: !!i.rule.require_dark
      };
  } catch (i) {
    throw ri(i) ? me("rule creation") : i;
  }
  throw me("rule creation");
}
async function Ii(n, t, e) {
  const i = typeof t == "string" ? t : t.id, o = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const a = await n.callWS({
      type: Rn,
      automation_id: i,
      ...o ? { entity_id: o } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((a == null ? void 0 : a.success) === !0)
      return;
  } catch (a) {
    throw ri(a) ? me("rule deletion") : a;
  }
  throw me("rule deletion");
}
console.log("[ht-location-inspector] module loaded");
var Ri, Mi;
try {
  (Mi = (Ri = import.meta) == null ? void 0 : Ri.hot) == null || Mi.accept(() => window.location.reload());
} catch {
}
const ve = class ve extends lt {
  constructor() {
    super(...arguments), this._activeTab = "detection", this._sourcesDirty = !1, this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._loadingActionRules = !1, this._nowEpochMs = Date.now(), this._actionToggleBusy = {}, this._actionServiceSelections = {}, this._actionDarkSelections = {}, this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._discardSourceChanges = () => {
      this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate();
    }, this._saveSourceChanges = async () => {
      !this.location || !this._stagedSources || !this._sourcesDirty || (await this._persistOccupancySources(this._stagedSources), this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate(), this._showToast("Saved source changes", "success"));
    };
  }
  render() {
    return this.location ? _`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderActionStartupConfig()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(t) {
    var e;
    if (t.has("hass") && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this.hass && (this._loadEntityAreaAssignments(), this._loadActionRules(), this._subscribeAutomationStateChanged())), t.has("forcedTab")) {
      const i = this._mapRequestedTab(this.forcedTab);
      i ? this._activeTab = i : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const i = t.get("location"), o = (i == null ? void 0 : i.id) || "", a = ((e = this.location) == null ? void 0 : e.id) || "";
      o !== a && (this._stagedSources = void 0, this._sourcesDirty = !1, this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {}, this._actionToggleBusy = {}, this._actionServiceSelections = {}, this.hass && this._loadEntityAreaAssignments()), this._loadActionRules();
    }
    if (t.has("entryId")) {
      const i = t.get("entryId") || "", o = this.entryId || "";
      i !== o && this._loadActionRules();
    }
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const o = await Kn(this.hass, e, this.entryId);
      return t !== this._actionRulesLoadSeq ? !1 : (this._actionRules = o, !0);
    } catch (o) {
      return t !== this._actionRulesLoadSeq || (this._actionRulesError = (o == null ? void 0 : o.message) || "Failed to load automation rules"), !1;
    } finally {
      t === this._actionRulesLoadSeq && (this._loadingActionRules = !1, this.requestUpdate());
    }
  }
  async _loadEntityAreaAssignments() {
    var t;
    this._entityAreaLoadPromise || !((t = this.hass) != null && t.callWS) || (this._entityAreaLoadPromise = (async () => {
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "config/entity_registry/list" }),
          this.hass.callWS({ type: "config/device_registry/list" })
        ]), o = /* @__PURE__ */ new Map();
        if (Array.isArray(i))
          for (const s of i) {
            const l = typeof (s == null ? void 0 : s.id) == "string" ? s.id : void 0, c = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0;
            l && c && o.set(l, c);
          }
        const a = {}, r = {};
        if (Array.isArray(e))
          for (const s of e) {
            const l = typeof (s == null ? void 0 : s.entity_id) == "string" ? s.entity_id : void 0;
            if (!l) continue;
            const c = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0, u = typeof (s == null ? void 0 : s.device_id) == "string" ? o.get(s.device_id) : void 0;
            a[l] = c || u || null, r[l] = {
              hiddenBy: typeof (s == null ? void 0 : s.hidden_by) == "string" ? s.hidden_by : null,
              disabledBy: typeof (s == null ? void 0 : s.disabled_by) == "string" ? s.disabled_by : null,
              entityCategory: typeof (s == null ? void 0 : s.entity_category) == "string" ? s.entity_category : null
            };
          }
        this._entityAreaById = a, this._entityRegistryMetaById = r;
      } catch (e) {
        console.debug("[ht-location-inspector] failed to load entity/device registry area mapping", e), this._entityAreaById = {}, this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, o = this._getLockState(), a = this._getOccupancyState(), r = (a == null ? void 0 : a.state) === "on", s = a ? r ? "Occupied" : a.state === "off" ? "Vacant" : "Unknown" : "Unknown", l = a ? this._resolveVacantAt(a.attributes || {}, r) : void 0, c = r ? l instanceof Date ? this._formatDateTime(l) : l === null ? "No timeout scheduled" : "Unknown" : void 0;
    return _`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${r ? "occupied" : "vacant"}"
                data-testid="header-occupancy-status"
              >
                ${s}
              </span>
              <span
                class="status-chip ${o.isLocked ? "locked" : ""}"
                data-testid="header-lock-status"
              >
                ${o.isLocked ? "Locked" : "Unlocked"}
              </span>
              ${r ? _`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${c}
                    </span>
                  ` : ""}
            </div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-row">
            <span class="meta-label">${e}</span>
            <span class="meta-value">${i}</span>
          </div>
        </div>
      </div>
    `;
  }
  _headerIcon(t) {
    var i, o, a;
    const e = t.ha_area_id;
    return e && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e]) != null && a.icon) ? this.hass.areas[e].icon : $n(t);
  }
  _renderTabs() {
    return _`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "detection", this.requestUpdate();
    }}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "occupied_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "occupied_actions", this.requestUpdate();
    }}
        >
          On Occupied
        </button>
        <button
          class="tab ${this._activeTab === "vacant_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "vacant_actions", this.requestUpdate();
    }}
        >
          On Vacant
        </button>
      </div>
    `;
  }
  _renderContent() {
    const t = this._effectiveTab();
    return _`
      <div class="tab-content">
        ${t === "detection" ? this._renderOccupancyTab() : this._renderActionsTab(t === "occupied_actions" ? "occupied" : "vacant")}
      </div>
    `;
  }
  _effectiveTab() {
    return this._activeTab;
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "occupied_actions") return "occupied_actions";
    if (t === "vacant_actions") return "vacant_actions";
    if (t === "occupancy") return "detection";
    if (t === "actions") return "occupied_actions";
  }
  connectedCallback() {
    super.connectedCallback(), this._startClockTicker(), this._subscribeAutomationStateChanged();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._stopClockTicker(), this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0);
  }
  _scheduleActionRulesReload(t = 250) {
    this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._actionRulesReloadTimer = window.setTimeout(() => {
      this._actionRulesReloadTimer = void 0, this._loadActionRules();
    }, t);
  }
  async _subscribeAutomationStateChanged() {
    var t, e;
    if (this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), !!((e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents))
      try {
        this._unsubAutomationStateChanged = await this.hass.connection.subscribeEvents(
          (i) => {
            var a;
            const o = (a = i == null ? void 0 : i.data) == null ? void 0 : a.entity_id;
            typeof o != "string" || !o.startsWith("automation.") || this._scheduleActionRulesReload();
          },
          "state_changed"
        );
      } catch (i) {
        console.debug("[ht-location-inspector] failed to subscribe to automation state changes", i);
      }
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, o = (t.occupancy_sources || []).length, a = this._getLockState();
    return e ? _`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${o > 0 ? _`
                <div class="policy-warning">
                  This floor still has ${o} unsupported source${o === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              ` : ""}
        </div>
      ` : _`
      <div>
        <div class="card-section">
          ${a.isLocked ? _`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${a.lockedBy.length ? _`Held by ${a.lockedBy.join(", ")}.` : _`Occupancy is currently held by a lock.`}
              </div>
              ${a.lockModes.length ? _`
                    <div class="runtime-note">
                      Modes: ${a.lockModes.map((r) => this._lockModeLabel(r)).join(", ")}
                    </div>
                  ` : ""}
              ${a.directLocks.length ? _`
                    <div class="lock-directive-list">
                      ${a.directLocks.map((r) => _`
                        <div class="lock-directive">
                          <span class="lock-pill">${r.sourceId}</span>
                          <span>${this._lockModeLabel(r.mode)}</span>
                          <span>${this._lockScopeLabel(r.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : _`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="section-title">
            Sources
          </div>
          <div class="subsection-help">
            ${i ? "Use the left control to include a source from this area. Included sources show editable behavior below." : "This location is integration-owned (no direct HA area mapping). Add sources explicitly from Home Assistant entities below."}
          </div>
          ${i ? "" : _`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="subsection-help">
            ${i ? "Need cross-area behavior? Add a source from another area." : "Add sources from any HA area (or unassigned entities)."}
          </div>
          ${this._renderExternalSourceComposer(t)}
          ${this._sourcesDirty ? _`
            <div class="editor-actions sources-actions">
              <button
                class="button button-secondary"
                ?disabled=${this._savingSource}
                @click=${this._discardSourceChanges}
              >
                Discard
              </button>
              <button
                class="button button-primary"
                ?disabled=${this._savingSource}
                @click=${this._saveSourceChanges}
              >
                Save
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState();
    if (!e)
      return _`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? _`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const i = e.attributes || {}, o = e.state === "on", a = this._resolveVacantAt(i, o), r = o ? "Occupied" : e.state === "off" ? "Vacant" : "Unknown", s = o ? a instanceof Date ? this._formatDateTime(a) : a === null ? "No timeout scheduled" : "Unknown" : "-";
    return _`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${o ? "occupied" : "vacant"}">${r}</span>
          <span class="status-chip ${t.isLocked ? "locked" : ""}">
            ${t.isLocked ? "Locked" : "Unlocked"}
          </span>
        </div>
        <div class="runtime-summary-grid">
          <div class="runtime-summary-key">Vacant at</div>
          <div class="runtime-summary-value" data-testid="runtime-vacant-at">${s}</div>
          <div class="runtime-summary-key">Lock</div>
          <div class="runtime-summary-value">${t.isLocked ? "Locked" : "Unlocked"}</div>
        </div>
      </div>
    `;
  }
  _isMediaEntity(t) {
    return t.startsWith("media_player.");
  }
  _mediaSignalLabel(t) {
    return t === "color" ? "Color change" : t === "power" ? "Power" : t === "level" ? "Level change" : t === "volume" ? "Volume" : t === "mute" ? "Mute" : "Playback";
  }
  _signalDescription(t) {
    return t === "color" ? "RGB/color changes" : t === "power" ? "on/off" : t === "level" ? "brightness changes" : t === "volume" ? "volume changes" : t === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(t, e) {
    return e ? `${t}::${e}` : t;
  }
  _sourceKeyFromSource(t) {
    return t.signal_key ? this._sourceKey(t.entity_id, t.signal_key) : this._sourceKey(t.entity_id);
  }
  _defaultSignalKeyForEntity(t) {
    if (this._isMediaEntity(t)) return "playback";
    if (this._isDimmableEntity(t) || this._isColorCapableEntity(t)) return "power";
  }
  _candidateItemsForEntity(t) {
    if (!this._isMediaEntity(t)) {
      const e = this._isDimmableEntity(t), i = this._isColorCapableEntity(t);
      if (!e && !i)
        return [{ key: this._sourceKey(t), entityId: t }];
      const o = ["power"];
      return e && o.push("level"), i && o.push("color"), o.map((a) => ({
        key: this._sourceKey(t, a),
        entityId: t,
        signalKey: a
      }));
    }
    return ["playback", "volume", "mute"].map((e) => ({
      key: this._sourceKey(t, e),
      entityId: t,
      signalKey: e
    }));
  }
  _signalSortWeight(t) {
    return !t || t === "power" || t === "playback" ? 0 : t === "level" || t === "volume" ? 1 : t === "color" || t === "mute" ? 2 : 3;
  }
  _candidateTitle(t, e) {
    const i = this._entityName(t);
    return e && (t.startsWith("media_player.") || t.startsWith("light.")) ? `${i} — ${this._mediaSignalLabel(e)}` : !this._isMediaEntity(t) && !this._isDimmableEntity(t) && !this._isColorCapableEntity(t) ? i : `${i} — ${this._mediaSignalLabel(e)}`;
  }
  _mediaSignalDefaults(t, e) {
    return e === "playback" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "playback"),
      signal_key: "playback",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, e),
      signal_key: e,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _lightSignalDefaults(t, e) {
    return e === "power" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "power"),
      signal_key: "power",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : e === "color" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "color"),
      signal_key: "color",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _isDimmableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (typeof o.brightness == "number") return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((l) => l && l !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((l) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(l)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), o = /* @__PURE__ */ new Map();
    i.forEach((p, f) => o.set(this._sourceKeyFromSource(p), f));
    const a = [...this.location.entity_ids || []].sort(
      (p, f) => this._entityName(p).localeCompare(this._entityName(f))
    );
    new Set(a);
    const s = a.filter((p) => this._isCandidateEntity(p)).flatMap((p) => this._candidateItemsForEntity(p)), l = new Set(i.map((p) => this._sourceKeyFromSource(p))), c = s.filter((p) => {
      if (l.has(p.key)) return !0;
      const f = this._defaultSignalKeyForEntity(p.entityId);
      return p.signalKey === f || !f && !p.signalKey;
    }), u = new Set(s.map((p) => p.key)), d = i.filter((p) => !u.has(this._sourceKeyFromSource(p))).map((p) => ({
      key: this._sourceKeyFromSource(p),
      entityId: p.entity_id,
      signalKey: p.signal_key
    })), h = [...c, ...d].sort((p, f) => {
      const m = o.has(p.key), $ = o.has(f.key);
      if (m !== $) return m ? -1 : 1;
      const A = this._entityName(p.entityId).localeCompare(this._entityName(f.entityId));
      return A !== 0 ? A : this._signalSortWeight(p.signalKey) - this._signalSortWeight(f.signalKey);
    });
    return h.length ? _`
      <div class="candidate-list">
        ${h.map((p) => {
      const f = o.get(p.key), m = f !== void 0, $ = m ? i[f] : void 0, A = m && $ ? $ : void 0, y = this._modeOptionsForEntity(p.entityId);
      return _`
            <div class="source-card ${m ? "enabled" : ""}">
              <div class="candidate-item">
                <div class="source-enable-control">
                  <input
                    type="checkbox"
                    class="source-enable-input"
                    aria-label="Include source"
                    .checked=${m}
                    @change=${(k) => {
        const x = k.target.checked;
        x && !m ? this._addSourceWithDefaults(p.entityId, t, {
          resetExternalPicker: !1,
          signalKey: p.signalKey
        }) : !x && m && this._removeSource(f, t);
      }}
                  />
                </div>
                <div>
                  <div class="candidate-headline">
                    <div class="candidate-title">${this._candidateTitle(p.entityId, p.signalKey)}</div>
                    ${m && A && y.length > 1 ? _`
                          <div class="inline-mode-group">
                            <span class="inline-mode-label">Mode</span>
                            <select
                              class="inline-mode-select"
                              .value=${y.some((k) => k.value === A.mode) ? A.mode : y[0].value}
                              @change=${(k) => {
        const x = k.target.value, W = this.hass.states[p.entityId], H = In(A, x, W);
        this._updateSourceDraft(t, f, { ...H, entity_id: A.entity_id });
      }}
                            >
                              ${y.map((k) => _`<option value=${k.value}>${k.label}</option>`)}
                            </select>
                          </div>
                        ` : ""}
                  </div>
                  <div class="candidate-meta">${p.entityId} • ${this._entityState(p.entityId)}</div>
                  ${(this._isMediaEntity(p.entityId) || p.entityId.startsWith("light.")) && p.signalKey ? _`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(p.signalKey)}</div>` : ""}
                </div>
              </div>
              ${m && $ ? this._renderSourceEditor(t, $, f) : ""}
            </div>
          `;
    })}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? _`No occupancy-relevant entities found yet. Add one from another area to get started.` : _`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderExternalSourceComposer(t) {
    var u;
    const e = this._availableSourceAreas(), i = this._externalAreaId || "", o = i ? this._entitiesForArea(i) : [], a = this._externalEntityId || "", r = new Set(this._workingSources(t).map((d) => this._sourceKeyFromSource(d))), s = a ? this._defaultSignalKeyForEntity(a) : void 0, l = a ? this._sourceKey(a, s) : "", c = (u = this.location) != null && u.ha_area_id ? "Other Area" : "Source Area";
    return _`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">${c}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${i}
            @change=${(d) => {
      const h = d.target.value;
      this._externalAreaId = h, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">Select area...</option>
            <option value="__all__">Any area / unassigned</option>
            ${e.map((d) => _`<option value=${d.area_id}>${d.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${a}
            @change=${(d) => {
      this._externalEntityId = d.target.value, this.requestUpdate();
    }}
            ?disabled=${!i}
          >
            <option value="">Select sensor...</option>
            ${o.map((d) => _`
              <option
                value=${d}
                ?disabled=${r.has(this._sourceKey(d, this._defaultSignalKeyForEntity(d)))}
              >
                ${this._entityName(d)}${r.has(this._sourceKey(d, this._defaultSignalKeyForEntity(d))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !a || (l ? r.has(l) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(a, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(a)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderSourceEditor(t, e, i) {
    const o = e, a = this._eventLabelsForSource(e), r = this._sourceKeyFromSource(e), s = this._supportsOffBehavior(e), l = t.default_timeout || 300, c = this._onTimeoutMemory[r], u = o.on_timeout === null ? c ?? l : o.on_timeout ?? c ?? l, d = Math.max(1, Math.min(120, Math.round(u / 60))), h = o.off_trailing ?? 0, p = Math.max(0, Math.min(120, Math.round(h / 60)));
    return _`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? _`<div class="media-signals">Signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${a.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(o.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(o, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${i}"
              .value=${o.on_event || "trigger"}
              @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...o,
        on_event: f.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${a.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @input=${(f) => {
      const m = Number(f.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: m * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: m * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @change=${(f) => {
      const m = Math.max(1, Math.min(120, Number(f.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: m * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: m * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${o.on_timeout === null}
                @change=${(f) => {
      const m = f.target.checked, $ = this._onTimeoutMemory[r], A = d * 60, y = $ ?? A;
      m && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: o.on_timeout ?? y
      }), this._updateSourceDraft(t, i, {
        ...o,
        on_timeout: m ? null : y
      });
    }}
              />
              Indefinite (until ${a.offState})
            </label>
          </div>

          ${s ? _`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${a.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(o, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${i}"
                    .value=${o.off_event || "none"}
                    @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...o,
        off_event: f.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${a.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(p)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @input=${(f) => {
      const m = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: m * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(p)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @change=${(f) => {
      const m = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: m * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              ` : ""}
        </div>
      </div>
    `;
  }
  _renderActionsTab(t) {
    if (!this.location) return "";
    const e = this._actionTargetEntities(), i = t === "occupied" ? "When Occupied" : "When Vacant", o = t === "occupied" ? "Rules in this tab run when occupancy changes to occupied." : "Rules in this tab run when occupancy changes to vacant.";
    return _`
      <div>
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            ${i} device actions
          </div>

          <div class="subsection-help">
            Select the devices to manage in this tab. Media players intentionally support only
            Stop and Turn off here for common occupancy behavior.
            Use custom Home Assistant automations for advanced play/turn-on scenarios.
          </div>

          <div class="action-device-list">
            ${this._loadingActionRules ? _`
                  <div class="empty-state">
                    <div class="text-muted">Loading device actions...</div>
                  </div>
                ` : this._actionRulesError ? _`
                    <div class="empty-state">
                      <div class="text-muted">${this._actionRulesError}</div>
                    </div>
                  ` : e.length === 0 ? _`
                  <div class="empty-state">
                    <div class="text-muted">
                      No common controllable devices found for this location yet.
                    </div>
                  </div>
                ` : e.map(
      (a) => {
        const r = this._isManagedActionEnabled(a, t), s = this._actionToggleKey(a, t), l = !!this._actionToggleBusy[s], c = this._selectedManagedActionService(a, t), u = this._selectedManagedActionRequireDark(a, t), d = this._actionServiceOptions(a, t);
        return _`
                    <div class="source-item action-device-row ${r ? "enabled" : ""}">
                      <div class="action-include-control">
                        <input
                          type="checkbox"
                          class="action-include-input"
                          .checked=${r}
                          ?disabled=${l || this._loadingActionRules}
                          aria-label=${`Include ${this._entityName(a)}`}
                          @change=${(h) => this._handleManagedActionToggle(
          a,
          t,
          h.target.checked
        )}
                        />
                      </div>
                      <div class="source-icon">
                        <ha-icon .icon=${this._deviceIcon(a)}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${this._entityName(a)}</div>
                        <div class="source-details">
                          Entity: ${a}
                        </div>
                        <div class="source-details">
                          Current state: ${this._entityState(a)}
                        </div>
                      </div>
                      <div class="action-controls">
                        <select
                          class="action-service-select"
                          .value=${Tn(c)}
                          ?disabled=${l || this._loadingActionRules}
                          @change=${(h) => this._handleManagedActionServiceChange(
          a,
          t,
          h.target.value
        )}
                        >
                          ${d.map(
          (h) => _`<option value=${h.value}>${h.label}</option>`
        )}
                        </select>
                        <label class="action-dark-toggle">
                          <input
                            type="checkbox"
                            class="action-dark-input"
                            .checked=${u}
                            ?disabled=${l || this._loadingActionRules}
                            @change=${(h) => this._handleManagedActionDarkChange(
          a,
          t,
          h.target.checked
        )}
                          />
                          Only when dark
                        </label>
                        ${l ? _`<span class="text-muted">Saving...</span>` : ""}
                      </div>
                    </div>
                  `;
      }
    )}
          </div>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            ${o} Topomation creates tagged Home Assistant automations automatically.
          </div>
        </div>
      </div>
    `;
  }
  _renderActionStartupConfig() {
    const t = this._getAutomationConfig(), e = !!t.reapply_last_state_on_startup;
    return _`
      <div class="startup-inline">
        <label class="startup-inline-toggle">
          <input
            type="checkbox"
            class="switch-input"
            .checked=${e}
            @change=${(i) => {
      const o = i.target.checked;
      this._updateAutomationConfig({
        ...t,
        reapply_last_state_on_startup: o
      });
    }}
          />
          Reapply occupancy actions on startup
        </label>
        <div class="startup-inline-help">
          Applies to both On Occupied and On Vacant actions after Home Assistant startup.
        </div>
      </div>
    `;
  }
  _actionToggleKey(t, e) {
    return `${e}:${t}`;
  }
  _actionTargetEntities() {
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set();
    for (const e of this.location.entity_ids || [])
      this._isActionDeviceEntity(e) && t.add(e);
    if (this.location.ha_area_id)
      for (const e of this._entitiesForArea(this.location.ha_area_id))
        this._isActionDeviceEntity(e) && t.add(e);
    return [...t].sort((e, i) => {
      const o = this._actionDeviceType(e) || "zzzz", a = this._actionDeviceType(i) || "zzzz";
      return o !== a ? o.localeCompare(a) : this._entityName(e).localeCompare(this._entityName(i));
    });
  }
  _isActionDeviceEntity(t) {
    return !!this._actionDeviceType(t);
  }
  _actionDeviceType(t) {
    var u, d;
    const e = (d = (u = this.hass) == null ? void 0 : u.states) == null ? void 0 : d[t];
    if (!e) return;
    const i = t.split(".", 1)[0], o = e.attributes || {};
    if (i === "fan") return "fan";
    if (i === "media_player") {
      const h = String(o.device_class || "").toLowerCase(), p = `${o.friendly_name || ""} ${t}`.toLowerCase();
      return h === "tv" || /\btv\b/.test(p) || p.includes("television") ? "tv" : "stereo";
    }
    if (i !== "light") return;
    const a = Array.isArray(o.supported_color_modes) ? o.supported_color_modes : [], r = a.some(
      (h) => ["hs", "xy", "rgb", "rgbw", "rgbww", "color_temp"].includes(String(h))
    ), s = Array.isArray(o.hs_color) || Array.isArray(o.xy_color) || Array.isArray(o.rgb_color) || typeof o.color_temp_kelvin == "number" || typeof o.color_temp == "number";
    if (r || s) return "color_light";
    const l = a.some((h) => String(h) !== "onoff"), c = typeof o.brightness == "number" || typeof o.brightness_pct == "number" || typeof o.brightness_step == "number" || typeof o.brightness_step_pct == "number";
    return l || c ? "dimmer" : "light";
  }
  _actionDeviceTypeLabel(t) {
    return t === "light" ? "Light" : t === "dimmer" ? "Dimmer" : t === "color_light" ? "Color light" : t === "fan" ? "Fan" : t === "stereo" ? "Stereo" : t === "tv" ? "TV" : "Device";
  }
  _defaultManagedActionService(t, e) {
    return t.split(".", 1)[0] === "media_player" ? e === "occupied" ? "media_stop" : "turn_off" : e === "occupied" ? "turn_on" : "turn_off";
  }
  _actionServiceOptions(t, e) {
    const i = t.split(".", 1)[0];
    if (i === "cover")
      return [
        { value: "open_cover", label: "Open cover" },
        { value: "close_cover", label: "Close cover" },
        { value: "stop_cover", label: "Stop cover" }
      ];
    if (i === "media_player") {
      const a = this._defaultManagedActionService(t, e);
      return [
        { value: "media_stop", label: "Stop" },
        { value: "turn_off", label: "Turn off" }
      ].sort((r, s) => r.value === a ? -1 : s.value === a ? 1 : 0);
    }
    const o = this._defaultManagedActionService(t, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" },
      { value: "toggle", label: "Toggle" }
    ].sort((a, r) => a.value === o ? -1 : r.value === o ? 1 : 0);
  }
  _actionServiceLabel(t) {
    return t.split("_").map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
  }
  _selectedManagedActionService(t, e) {
    const i = this._actionToggleKey(t, e), o = this._actionServiceSelections[i];
    if (o) return o;
    const a = this._rulesForManagedActionEntity(t, e), r = a.find(
      (l) => l.enabled && typeof l.action_service == "string" && l.action_service.length > 0
    );
    if (r != null && r.action_service) return r.action_service;
    const s = a.find(
      (l) => typeof l.action_service == "string" && l.action_service.length > 0
    );
    return s != null && s.action_service ? s.action_service : this._defaultManagedActionService(t, e);
  }
  _selectedManagedActionRequireDark(t, e) {
    const i = this._actionToggleKey(t, e);
    if (Object.prototype.hasOwnProperty.call(this._actionDarkSelections, i))
      return !!this._actionDarkSelections[i];
    const o = this._rulesForManagedActionEntity(t, e), a = o.find((s) => s.enabled);
    if (a)
      return !!a.require_dark;
    const r = o[0];
    return r ? !!r.require_dark : !1;
  }
  _rulesForManagedActionEntity(t, e) {
    return this._actionRules.filter(
      (i) => i.trigger_type === e && i.action_entity_id === t
    );
  }
  _isManagedActionEnabled(t, e) {
    return this._rulesForManagedActionEntity(t, e).some((i) => i.enabled);
  }
  _isManagedActionServiceSelected(t, e, i) {
    return this._rulesForManagedActionEntity(t, e).some(
      (o) => o.enabled && o.action_service === i
    );
  }
  _isManagedActionRequireDarkSelected(t, e, i) {
    return this._rulesForManagedActionEntity(t, e).some(
      (o) => o.enabled && !!o.require_dark === i
    );
  }
  async _reloadActionRulesUntil(t, e = 8, i = 250) {
    for (let o = 0; o < e; o += 1) {
      if (t() || await this._loadActionRules() && t())
        return !0;
      o < e - 1 && await new Promise((r) => window.setTimeout(r, i));
    }
    return !1;
  }
  _deviceIcon(t) {
    const e = this._actionDeviceType(t);
    return e === "light" ? "mdi:lightbulb-outline" : e === "dimmer" ? "mdi:lightbulb-on" : e === "color_light" ? "mdi:palette" : e === "fan" ? "mdi:fan" : e === "stereo" ? "mdi:speaker" : e === "tv" ? "mdi:television" : "mdi:robot";
  }
  _managedRuleName(t, e) {
    var s;
    const i = ((s = this.location) == null ? void 0 : s.name) || "Location", o = this._entityName(t), a = this._selectedManagedActionService(t, e).replace(/_/g, " ");
    return `${i} ${e === "occupied" ? "Occupied" : "Vacant"}: ${o} (${a})`;
  }
  async _replaceManagedActionRules(t, e, i, o) {
    if (!this.location) return;
    const a = this._rulesForManagedActionEntity(t, e);
    return a.length > 0 && await Promise.all(
      a.map((s) => Ii(this.hass, s, this.entryId))
    ), await Vn(this.hass, {
      location: this.location,
      name: this._managedRuleName(t, e),
      trigger_type: e,
      action_entity_id: t,
      action_service: i,
      require_dark: o
    }, this.entryId);
  }
  _setManagedActionRuleLocal(t, e, i, o, a) {
    const r = {
      ...t,
      trigger_type: i,
      action_entity_id: e,
      action_service: o,
      require_dark: a,
      enabled: !0
    }, s = this._actionRules.filter(
      (l) => !(l.trigger_type === i && l.action_entity_id === e)
    );
    this._actionRules = [...s, r];
  }
  _removeManagedActionRulesLocal(t, e) {
    this._actionRules = this._actionRules.filter(
      (i) => !(i.trigger_type === e && i.action_entity_id === t)
    );
  }
  async _handleManagedActionServiceChange(t, e, i) {
    var s, l, c;
    const o = this._actionToggleKey(t, e);
    if (this._actionServiceSelections = {
      ...this._actionServiceSelections,
      [o]: i
    }, !this._isManagedActionEnabled(t, e)) {
      this.requestUpdate();
      return;
    }
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    const r = Date.now();
    try {
      const u = this._selectedManagedActionRequireDark(t, e);
      console.debug("[ht-location-inspector] managed action service save start", {
        locationId: (s = this.location) == null ? void 0 : s.id,
        entityId: t,
        triggerType: e,
        actionService: i,
        requireDark: u
      });
      const d = await this._replaceManagedActionRules(
        t,
        e,
        i,
        u
      );
      d && this._setManagedActionRuleLocal(
        d,
        t,
        e,
        i,
        u
      );
      const h = await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, i) && this._isManagedActionRequireDarkSelected(t, e, u)
      );
      console.debug("[ht-location-inspector] managed action service save complete", {
        locationId: (l = this.location) == null ? void 0 : l.id,
        entityId: t,
        triggerType: e,
        actionService: i,
        requireDark: u,
        converged: h,
        duration_ms: Date.now() - r
      }), h || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (u) {
      console.error("Failed to update managed action service", {
        locationId: (c = this.location) == null ? void 0 : c.id,
        entityId: t,
        triggerType: e,
        actionService: i,
        error: u
      }), this._showToast((u == null ? void 0 : u.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: u, ...d } = this._actionToggleBusy;
      this._actionToggleBusy = d, this.requestUpdate();
    }
  }
  async _handleManagedActionDarkChange(t, e, i) {
    var s, l, c;
    const o = this._actionToggleKey(t, e);
    if (this._actionDarkSelections = {
      ...this._actionDarkSelections,
      [o]: i
    }, !this._isManagedActionEnabled(t, e)) {
      this.requestUpdate();
      return;
    }
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    const r = Date.now();
    try {
      const u = this._selectedManagedActionService(t, e);
      console.debug("[ht-location-inspector] managed action dark save start", {
        locationId: (s = this.location) == null ? void 0 : s.id,
        entityId: t,
        triggerType: e,
        actionService: u,
        requireDark: i
      });
      const d = await this._replaceManagedActionRules(
        t,
        e,
        u,
        i
      );
      d && this._setManagedActionRuleLocal(
        d,
        t,
        e,
        u,
        i
      );
      const h = await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, u) && this._isManagedActionRequireDarkSelected(t, e, i)
      );
      console.debug("[ht-location-inspector] managed action dark save complete", {
        locationId: (l = this.location) == null ? void 0 : l.id,
        entityId: t,
        triggerType: e,
        actionService: u,
        requireDark: i,
        converged: h,
        duration_ms: Date.now() - r
      }), h || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (u) {
      console.error("Failed to update managed action dark condition", {
        locationId: (c = this.location) == null ? void 0 : c.id,
        entityId: t,
        triggerType: e,
        requireDark: i,
        error: u
      }), this._showToast((u == null ? void 0 : u.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: u, ...d } = this._actionToggleBusy;
      this._actionToggleBusy = d, this.requestUpdate();
    }
  }
  async _handleManagedActionToggle(t, e, i) {
    var r;
    if (!this.location) return;
    const o = this._actionToggleKey(t, e);
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    const a = Date.now();
    try {
      const s = this._rulesForManagedActionEntity(t, e), l = this._selectedManagedActionService(t, e), c = this._selectedManagedActionRequireDark(t, e);
      if (console.debug("[ht-location-inspector] managed action toggle start", {
        locationId: this.location.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        actionService: l,
        requireDark: c,
        existingRuleCount: s.length
      }), i) {
        const d = await this._replaceManagedActionRules(
          t,
          e,
          l,
          c
        );
        d && this._setManagedActionRuleLocal(
          d,
          t,
          e,
          l,
          c
        );
      } else s.length > 0 && (await Promise.all(
        s.map((d) => Ii(this.hass, d, this.entryId))
      ), this._removeManagedActionRulesLocal(t, e));
      const u = await this._reloadActionRulesUntil(
        () => this._isManagedActionEnabled(t, e) === i && (!i || this._isManagedActionServiceSelected(t, e, l) && this._isManagedActionRequireDarkSelected(t, e, c))
      );
      console.debug("[ht-location-inspector] managed action toggle complete", {
        locationId: this.location.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        actionService: l,
        requireDark: c,
        converged: u,
        duration_ms: Date.now() - a
      }), u || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (s) {
      console.error("Failed to update managed action rule", {
        locationId: (r = this.location) == null ? void 0 : r.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        error: s
      }), this._showToast((s == null ? void 0 : s.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: s, ...l } = this._actionToggleBusy;
      this._actionToggleBusy = l, this.requestUpdate();
    }
  }
  _workingSources(t) {
    return this._stagedSources ? [...this._stagedSources] : [...t.occupancy_sources || []];
  }
  _setWorkingSources(t, e) {
    const i = e.map((a) => this._normalizeSource(a.entity_id, a)), o = { ...this._onTimeoutMemory };
    for (const a of i)
      typeof a.on_timeout == "number" && a.on_timeout > 0 && (o[this._sourceKeyFromSource(a)] = a.on_timeout);
    this._onTimeoutMemory = o, this._stagedSources = i, this._sourcesDirty = !0, this.requestUpdate();
  }
  _updateSourceDraft(t, e, i) {
    const o = this._workingSources(t), a = o[e];
    if (!a) return;
    const r = this._modeOptionsForEntity(a.entity_id).map((l) => l.value), s = this._normalizeSource(
      a.entity_id,
      {
        ...i,
        mode: r.includes(i.mode) ? i.mode : r[0]
      }
    );
    o[e] = s, this._setWorkingSources(t, o);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), o = i[t];
    if (!o) return;
    i.splice(t, 1);
    const a = { ...this._onTimeoutMemory };
    delete a[this._sourceKeyFromSource(o)], this._onTimeoutMemory = a, this._setWorkingSources(e, i);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location || this._isFloorLocation()) return;
    const o = this._workingSources(e), a = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (o.some((u) => this._sourceKeyFromSource(u) === a))
      return;
    const r = this.hass.states[t];
    if (!r) {
      this._showToast(`Entity not found: ${t}`, "error");
      return;
    }
    let l = _o(r);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? l = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (l = this._lightSignalDefaults(t, i.signalKey));
    const c = this._normalizeSource(t, l);
    this._setWorkingSources(e, [...o, c]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate());
  }
  async _persistOccupancySources(t) {
    if (!this.location) return;
    const e = this._getOccupancyConfig();
    this._savingSource = !0, this.requestUpdate();
    try {
      await this._updateConfig({
        ...e,
        occupancy_sources: t
      });
    } finally {
      this._savingSource = !1, this.requestUpdate();
    }
  }
  _normalizeSource(t, e) {
    var d;
    const i = this._isMediaEntity(t), o = this._isDimmableEntity(t), a = this._isColorCapableEntity(t), r = (d = e.source_id) != null && d.includes("::") ? e.source_id.split("::")[1] : void 0, s = this._defaultSignalKeyForEntity(t), l = e.signal_key || r || s;
    let c;
    (i && (l === "playback" || l === "volume" || l === "mute") || (o || a) && (l === "power" || l === "level" || l === "color")) && (c = l);
    const u = e.source_id || this._sourceKey(t, c);
    return {
      entity_id: t,
      source_id: u,
      signal_key: c,
      mode: e.mode || "any_change",
      on_event: e.on_event || "trigger",
      on_timeout: e.on_timeout,
      off_event: e.off_event || "none",
      off_trailing: e.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.occupancy) || {};
  }
  _getAutomationConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.automation) || {};
  }
  async _updateAutomationConfig(t) {
    await this._updateModuleConfig("automation", t);
  }
  _availableSourceAreas() {
    var o, a;
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(e).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, s) => r.name.localeCompare(s.name));
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((o) => this._isCandidateEntity(o)).sort((o, a) => this._entityName(o).localeCompare(this._entityName(a))) : Object.keys(e).filter((o) => {
      var r, s;
      const a = this._entityAreaById[o];
      return a !== void 0 ? a === t : ((s = (r = e[o]) == null ? void 0 : r.attributes) == null ? void 0 : s.area_id) === t;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, a) => this._entityName(o).localeCompare(this._entityName(a)));
  }
  _isCandidateEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const o = e.attributes || {};
    if (o.device_class === "occupancy" && o.location_id) return !1;
    const a = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(a))
      return !0;
    if (a === "binary_sensor") {
      const l = String(o.device_class || "");
      return l ? [
        "motion",
        "occupancy",
        "presence",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock"
      ].includes(l) : !0;
    }
    return !1;
  }
  _getOccupancyState() {
    var e;
    if (!this.location) return;
    const t = ((e = this.hass) == null ? void 0 : e.states) || {};
    for (const i of Object.values(t)) {
      const o = (i == null ? void 0 : i.attributes) || {};
      if (o.device_class === "occupancy" && o.location_id === this.location.id)
        return i;
    }
  }
  _activeContributorsExcluding(t) {
    const e = this._getOccupancyState();
    if (((e == null ? void 0 : e.state) || "").toLowerCase() !== "on") return [];
    const i = (e == null ? void 0 : e.attributes) || {}, o = Array.isArray(i.contributions) ? i.contributions : [];
    if (!o.length) return [];
    const a = String(t || "").trim(), r = o.map((s) => String((s == null ? void 0 : s.source_id) || "").trim()).filter((s) => s.length > 0 && s !== a);
    return Array.from(new Set(r));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, o = e.lock_modes, a = e.direct_locks, r = Array.isArray(i) ? i.map((c) => String(c)) : [], s = Array.isArray(o) ? o.map((c) => String(c)) : [], l = Array.isArray(a) ? a.map((c) => ({
      sourceId: String((c == null ? void 0 : c.source_id) || "unknown"),
      mode: String((c == null ? void 0 : c.mode) || "freeze"),
      scope: String((c == null ? void 0 : c.scope) || "self")
    })).sort(
      (c, u) => `${c.sourceId}:${c.mode}:${c.scope}`.localeCompare(`${u.sourceId}:${u.mode}:${u.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: r,
      lockModes: s,
      directLocks: l
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i)
      return i;
    const o = Array.isArray(t.contributions) ? t.contributions : [];
    if (!o.length)
      return;
    let a = !1, r;
    for (const s of o) {
      const l = s == null ? void 0 : s.expires_at;
      if (l == null) {
        a = !0;
        continue;
      }
      const c = this._parseDateValue(l);
      c && (!r || c.getTime() > r.getTime()) && (r = c);
    }
    return a ? null : r;
  }
  _parseDateValue(t) {
    if (typeof t != "string" || !t) return;
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? void 0 : e;
  }
  _formatDateTime(t) {
    return new Intl.DateTimeFormat(void 0, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(t);
  }
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), o = Math.floor(e % 86400 / 3600), a = Math.floor(e % 3600 / 60), r = e % 60, s = [];
    return i > 0 && s.push(`${i}d`), o > 0 && s.push(`${o}h`), a > 0 && s.length < 2 && s.push(`${a}m`), (s.length === 0 || i === 0 && o === 0 && a === 0) && s.push(`${r}s`), s.slice(0, 2).join(" ");
  }
  _lockModeLabel(t) {
    return t === "block_occupied" ? "Block occupied" : t === "block_vacant" ? "Block vacant" : "Freeze";
  }
  _lockScopeLabel(t) {
    return t === "subtree" ? "Subtree" : "Self";
  }
  _startClockTicker() {
    this._clockTimer === void 0 && (this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1e3));
  }
  _stopClockTicker() {
    this._clockTimer !== void 0 && (window.clearInterval(this._clockTimer), this._clockTimer = void 0);
  }
  _describeSource(t, e) {
    const i = t.mode === "any_change" ? "Any change" : "Specific states", o = t.on_timeout === null ? null : t.on_timeout ?? e, a = t.off_trailing ?? 0, r = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", s = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(a)})` : "OFF: ignore";
    return `${i} • ${r} • ${s}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], o = t.on_timeout === null ? null : t.on_timeout ?? e, a = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(_`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(_`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      _`<span class="event-chip off">OFF -> clear (${this._formatDuration(a)})</span>`
    ) : i.push(_`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t], i = (e == null ? void 0 : e.attributes) || {}, o = t.split(".", 1)[0], a = String(i.device_class || "");
    return o === "person" || o === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : o === "binary_sensor" ? ["door", "garage_door", "opening", "window", "motion", "presence", "occupancy"].includes(a) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(t) {
    const e = t.entity_id.split(".", 1)[0];
    return !(e === "media_player" && (t.signal_key === "volume" || t.signal_key === "mute") || e === "light" && (t.signal_key === "level" || t.signal_key === "color"));
  }
  _eventLabelsForSource(t) {
    var c, u;
    const e = t.entity_id, i = (u = (c = this.hass) == null ? void 0 : c.states) == null ? void 0 : u[e], o = (i == null ? void 0 : i.attributes) || {}, a = e.split(".", 1)[0], r = String(o.device_class || "");
    let s = "ON", l = "OFF";
    if (a === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(r))
      s = "Open", l = "Closed";
    else if (a === "binary_sensor" && r === "motion")
      s = "Motion", l = "No motion";
    else if (a === "binary_sensor" && ["presence", "occupancy"].includes(r))
      s = "Detected", l = "Not detected";
    else if (a === "person" || a === "device_tracker")
      s = "Home", l = "Away";
    else {
      if (a === "media_player")
        return t.signal_key === "volume" ? {
          onState: "Volume change",
          offState: "No volume change",
          onBehavior: "Volume change behavior",
          onTimeout: "Volume timeout",
          offBehavior: "No-volume behavior",
          offDelay: "No-volume delay"
        } : t.signal_key === "mute" ? {
          onState: "Mute change",
          offState: "No mute change",
          onBehavior: "Mute change behavior",
          onTimeout: "Mute timeout",
          offBehavior: "No-mute behavior",
          offDelay: "No-mute delay"
        } : {
          onState: "Playing",
          offState: "Paused/idle",
          onBehavior: "Playing behavior",
          onTimeout: "Playing timeout",
          offBehavior: "Paused/idle behavior",
          offDelay: "Paused/idle delay"
        };
      if (a === "light" && t.signal_key === "level")
        return {
          onState: "Level change",
          offState: "No level change",
          onBehavior: "Level change behavior",
          onTimeout: "Level timeout",
          offBehavior: "No-level behavior",
          offDelay: "No-level delay"
        };
      if (a === "light" && t.signal_key === "color")
        return {
          onState: "Color change",
          offState: "No color change",
          onBehavior: "Color change behavior",
          onTimeout: "Color timeout",
          offBehavior: "No-color behavior",
          offDelay: "No-color delay"
        };
      (a === "light" && t.signal_key === "power" || a === "light" || a === "switch" || a === "fan") && (s = "On", l = "Off");
    }
    return {
      onState: s,
      offState: l,
      onBehavior: `${s} behavior`,
      onTimeout: `${s} timeout`,
      offBehavior: `${l} behavior`,
      offDelay: `${l} delay`
    };
  }
  _formatDuration(t) {
    return t === null ? "indefinite" : !t || t <= 0 ? "0m" : `${Math.floor(t / 60)}m`;
  }
  _entityName(t) {
    var e, i;
    return ((i = (e = this.hass.states[t]) == null ? void 0 : e.attributes) == null ? void 0 : i.friendly_name) || t;
  }
  _entityState(t) {
    var i;
    const e = (i = this.hass.states[t]) == null ? void 0 : i.state;
    return e || "unknown";
  }
  async _handleTestSource(t, e) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (e === "trigger") {
          const r = (this.location.modules.occupancy || {}).default_timeout || 300, s = t.on_timeout === null ? r : t.on_timeout ?? r, l = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: this._serviceDataWithEntryId({
              location_id: this.location.id,
              source_id: l,
              timeout: s
            })
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: l,
                timeout: s
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${l}`, "success");
          return;
        }
        const i = t.off_trailing ?? 0, o = t.source_id || t.entity_id, a = i <= 0;
        if (await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: a ? "vacate" : "clear",
          service_data: this._serviceDataWithEntryId(a ? {
            location_id: this.location.id
          } : {
            location_id: this.location.id,
            source_id: o,
            trailing_timeout: i
          })
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: a ? "vacate" : "clear",
              locationId: this.location.id,
              sourceId: o,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), a)
          this._showToast(`Vacated ${o}`, "success");
        else {
          const r = this._activeContributorsExcluding(o);
          if (r.length > 0) {
            const s = r.slice(0, 2).join(", "), l = r.length > 2 ? ` +${r.length - 2} more` : "";
            this._showToast(`Cleared ${o}; still occupied by ${s}${l}`, "error");
          } else
            this._showToast(`Cleared ${o}`, "success");
        }
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(t, e = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: t,
          type: e === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _updateModuleConfig(t, e) {
    if (this.location)
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/set_module_config",
            location_id: this.location.id,
            module_id: t,
            config: e
          })
        ), this.location.modules[t] = e, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(t) {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, i = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: i });
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _handleTimeoutSliderInput(t) {
    const e = t.target, i = e.closest(".config-value");
    if (!i) return;
    const o = i.querySelector("input.input");
    o && (o.value = e.value);
  }
  _handleTimeoutChange(t) {
    const e = t.target, i = parseInt(e.value, 10);
    if (Number.isNaN(i)) return;
    const o = Math.max(1, Math.min(120, i));
    e.value = String(o);
    const a = o * 60, r = e.closest(".config-value");
    if (r) {
      const l = r.querySelector("input.timeout-slider");
      l && (l.value = String(o));
      const c = r.querySelector("input.input");
      c && (c.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const s = this.location.modules.occupancy || {};
    this._updateConfig({ ...s, default_timeout: a });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && ct(this.location) === "floor";
  }
};
ve.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  entryId: { attribute: !1 },
  forcedTab: { type: String }
}, ve.styles = [
  xe,
  Gt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-main {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        min-width: 0;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        min-width: 0;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .header-status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .header-vacant-at {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .header-meta {
        min-width: 180px;
        display: flex;
        justify-content: flex-end;
      }

      .meta-row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 8px;
        margin-top: 4px;
      }

      .meta-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-align: right;
      }

      .meta-value {
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
      }

      .runtime-summary {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .runtime-summary-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--divider-color);
      }

      .status-chip.occupied {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .status-chip.vacant {
        color: var(--text-secondary-color);
      }

      .status-chip.locked {
        color: var(--warning-color);
        border-color: rgba(var(--rgb-warning-color), 0.35);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .runtime-summary-grid {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 12px;
        max-width: 560px;
      }

      .runtime-summary-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .runtime-summary-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .startup-inline {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .startup-inline-toggle {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .startup-inline-help {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-row.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .action-device-row {
        grid-template-columns: 28px 24px minmax(0, 1fr) auto;
      }

      .action-include-control {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-include-input {
        appearance: auto;
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .action-include-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.45);
        outline-offset: 2px;
      }

      .action-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .action-service-select {
        min-width: 170px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .action-dark-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        cursor: pointer;
        user-select: none;
      }

      .action-dark-input {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .service-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 8px;
        border-radius: 999px;
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
        font-weight: 600;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-submeta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .candidate-headline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 10px 12px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-main {
          width: 100%;
        }

        .header-meta {
          width: 100%;
          min-width: 0;
        }

        .meta-label,
        .meta-value {
          text-align: left;
        }

        .runtime-summary-grid {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }
      }
    `
];
let Ge = ve;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", Ge);
  } catch (n) {
    console.error("[ht-location-inspector] failed to define element", n);
  }
console.log("[ht-location-dialog] module loaded");
var Ni, Bi;
try {
  (Bi = (Ni = import.meta) == null ? void 0 : Ni.hot) == null || Bi.accept(() => window.location.reload());
} catch {
}
const be = class be extends lt {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (t) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Location Icon (optional)"
    })[t.name] || t.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(t) {
    var e, i, o;
    if (t.has("open")) {
      const a = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", a, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((r) => {
        var s, l;
        return `${r.name}(${(l = (s = r.modules) == null ? void 0 : s._meta) == null ? void 0 : l.type})`;
      })), this.open && !a) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const r = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, s = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: r.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: s || void 0
          };
        } else {
          const r = this.defaultType ?? "area", s = this.defaultParentId;
          this._config = {
            name: "",
            type: r,
            parent_id: s || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(t) {
    super.updated(t), t.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var o, a;
        const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const r = e.shadowRoot.querySelector('input[type="text"]');
          if (r) {
            console.log("[LocationDialog] Focusing input:", r), r.focus(), r.select();
            return;
          }
        }
        const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const t = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), _`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? _`
            <div class="error-message">${this._error}</div>
          ` : ""}

        <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${t}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <ha-button
          slot="secondaryAction"
          .dialogAction=${"cancel"}
          @click=${this._handleCancel}
          ?disabled=${this._submitting}
        >
          Cancel
        </ha-button>
        <ha-button
          slot="primaryAction"
          .dialogAction=${"confirm"}
          @click=${this._handleSubmit}
          ?disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </ha-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const t = this._getValidParents(), e = this._includeRootOption(), i = e || t.length > 1;
    console.log("[LocationDialog] parentOptions:", t), this.location;
    const o = [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" },
              { value: "building", label: "Building" },
              { value: "grounds", label: "Grounds" },
              { value: "subarea", label: "Subarea" }
            ]
          }
        }
      }
    ];
    return i && o.push({
      name: "parent_id",
      selector: {
        select: {
          options: [
            ...e ? [{ value: "", label: "(Root Level)" }] : [],
            ...t
          ]
        }
      }
    }), o.push({
      name: "icon",
      selector: { icon: {} }
    }), o;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/history/2026.02.24-ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Floors can be root-level or children of Building only
   * - Building/Grounds wrappers are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const t = this._config.type, e = je(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const o = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: o,
      totalLocations: this.locations.length
    }), o.length === 0) return [];
    const a = this.locations.filter((r) => {
      if (r.is_explicit_root) return !1;
      const s = ct(r);
      return o.includes(s);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", a.length, a.map((r) => r.label)), a;
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = je(this._config.type);
    if (t.length === 1 && t[0] === "root") return null;
    const i = String(this._config.parent_id || "").trim();
    if (i) return i;
    const o = this._getValidParents();
    return o.length === 1 ? String(o[0].value) : null;
  }
  _handleValueChanged(t) {
    console.log("[LocationDialog] value-changed received:", t.detail), this._config = { ...this._config, ...t.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  _formatSaveError(t) {
    const e = String((t == null ? void 0 : t.message) || t || "Failed to save location"), i = e.toLowerCase();
    return i.includes("location lifecycle mutations are disabled in this adapter") || i.includes("create/rename/delete floors and areas") ? "Legacy policy error detected. Restart Home Assistant and hard refresh the browser to load updated location create/update support." : e;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      this.location ? (await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/update",
          location_id: this.location.id,
          changes: {
            name: this._config.name,
            parent_id: this._submitParentId()
          }
        })
      ), await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "_meta",
          config: {
            type: this._config.type
          }
        })
      )) : await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/create",
          name: this._config.name,
          parent_id: this._submitParentId(),
          meta: {
            type: this._config.type
          }
        })
      ), this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: !0,
        composed: !0
      })), this.open = !1;
    } catch (t) {
      console.error("Failed to save location:", t), this._error = this._formatSaveError(t);
    } finally {
      this._submitting = !1;
    }
  }
  _handleCancel() {
    console.log("[LocationDialog] Cancel clicked"), this.open = !1, this._handleClosed();
  }
  _handleClosed() {
    console.log("[LocationDialog] Closed event fired"), this.open = !1, this._error = void 0, this._submitting = !1, this._config = {
      name: "",
      type: "area"
    }, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !1,
      composed: !1
    }));
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
};
be.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  entryId: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, be.styles = [
  xe,
  Gt`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let Qe = be;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Qe);
const Oi = "topomation:panel-tree-split", Fe = 0.4, ze = 0.25, Ue = 0.75;
console.log("[topomation-panel] module loaded");
var Fi, zi;
try {
  (zi = (Fi = import.meta) == null ? void 0 : Fi.hot) == null || zi.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends lt {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._treePanelSplit = Fe, this._isResizingPanels = !1, this._hasLoaded = !1, this._loadSeq = 0, this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleNewLocation = (t) => {
      t && (t.preventDefault(), t.stopPropagation()), this._editingLocation = void 0, this._newLocationDefaults = {
        parentId: null,
        type: "building"
      }, this._locationDialogOpen = !0;
    }, this._handleDeleteSelected = (t) => {
      t && (t.preventDefault(), t.stopPropagation());
      const e = this._getSelectedLocation();
      if (!e) {
        this._showToast("Select a location to delete", "warning");
        return;
      }
      if (!this._canDeleteLocation(e)) {
        this._showToast(this._deleteDisabledReason(e), "warning");
        return;
      }
      confirm(`Delete "${e.name}"?`) && this._handleLocationDelete(
        new CustomEvent("location-delete", {
          detail: { location: e }
        })
      );
    }, this._handleKeyDown = (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "s" && (t.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (t.ctrlKey || t.metaKey) && t.key === "z" && !t.shiftKey && (t.preventDefault(), console.log("Undo requested")), (t.ctrlKey || t.metaKey) && (t.key === "y" || t.key === "z" && t.shiftKey) && (t.preventDefault(), console.log("Redo requested")), t.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), t.key === "?" && !t.ctrlKey && !t.metaKey && this._showKeyboardShortcutsHelp();
    }, this._handlePanelSplitterPointerDown = (t) => {
      this._isSplitStackedLayout() || (t.preventDefault(), this._panelResizePointerId = t.pointerId, this._isResizingPanels = !0, this._applyPanelSplitFromClientX(t.clientX), window.addEventListener("pointermove", this._handlePanelSplitterPointerMove), window.addEventListener("pointerup", this._handlePanelSplitterPointerUp), window.addEventListener("pointercancel", this._handlePanelSplitterPointerUp));
    }, this._handlePanelSplitterPointerMove = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || this._applyPanelSplitFromClientX(t.clientX));
    }, this._handlePanelSplitterPointerUp = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || (this._applyPanelSplitFromClientX(t.clientX, !0), this._stopPanelSplitterDrag()));
    }, this._handlePanelSplitterKeyDown = (t) => {
      if (this._isSplitStackedLayout()) return;
      const e = t.shiftKey ? 0.08 : 0.03;
      if (t.key === "ArrowLeft") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit - e, !0);
        return;
      }
      if (t.key === "ArrowRight") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit + e, !0);
        return;
      }
      if (t.key === "Home") {
        t.preventDefault(), this._setPanelSplit(ze, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(Ue, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(Fe, !0);
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen, this._syncStateChangedSubscription();
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (t) => {
      this._logEvent("ui", "source test", t.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    }, console.log("TopomationPanel constructed");
  }
  _enqueueLocationOp(t, e) {
    const o = (this._opQueueByLocationId.get(t) ?? Promise.resolve()).catch(() => {
    }).then(e);
    return this._opQueueByLocationId.set(t, o), o;
  }
  _scheduleReload(t = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._consistencyReloadTimer && (window.clearTimeout(this._consistencyReloadTimer), this._consistencyReloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(t);
    }, 150), this._consistencyReloadTimer = window.setTimeout(() => {
      this._consistencyReloadTimer = void 0, this._loadLocations(!0);
    }, 1100);
  }
  willUpdate(t) {
    super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations()), t.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), console.log("TopomationPanel connected"), this._restorePanelSplitPreference(), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._consistencyReloadTimer && (clearTimeout(this._consistencyReloadTimer), this._consistencyReloadTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/history/2026.02.24-frontend-patterns.md Section 1.1
   */
  shouldUpdate(t) {
    for (const e of t.keys())
      if (e !== "hass") return !0;
    if (t.has("hass")) {
      const e = t.get("hass");
      return !e || e.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return _`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return _`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (l) => l.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), o = e === "location" ? void 0 : e, a = "Automation", r = this._deleteDisabledReason(t), s = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return _`
      <div class="panel-container" style=${`--tree-panel-basis: ${s};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${_`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${r}
              >
                Delete Selected
              </button>
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${!1}
            .allowMove=${!0}
            .allowRename=${!0}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-move-blocked=${this._handleLocationMoveBlocked}
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
          ></ht-location-tree>
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(ze * 100)}
          aria-valuemax=${Math.round(Ue * 100)}
          aria-valuenow=${Math.round(this._treePanelSplit * 100)}
          tabindex="0"
          title="Drag to resize panes. Double-click to reset."
          @pointerdown=${this._handlePanelSplitterPointerDown}
          @keydown=${this._handlePanelSplitterKeyDown}
          @dblclick=${this._handlePanelSplitterReset}
        ></div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${a}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${t}
            .entryId=${this._activeEntryId()}
            .forcedTab=${o}
            @source-test=${this._handleSourceTest}
          ></ht-location-inspector>
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-actions") ? "actions" : "location";
  }
  _managerView() {
    var e, i, o;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "actions" ? t : (o = this.route) != null && o.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return {
      title: "Topology",
      subtitle: "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation."
    };
  }
  _renderDialogs() {
    var t, e;
    return _`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
        .entryId=${this._activeEntryId()}
        .defaultParentId=${(t = this._newLocationDefaults) == null ? void 0 : t.parentId}
        .defaultType=${(e = this._newLocationDefaults) == null ? void 0 : e.type}
        @dialog-closed=${() => {
      console.log("[Panel] Dialog closed event received"), this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>
    `;
  }
  async _loadLocations(t = !1) {
    var o;
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      console.log("Calling WebSocket API: topomation/locations/list"), console.log("hass.callWS available:", typeof this.hass.callWS);
      const a = await Promise.race([
        this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/list"
          })
        ),
        new Promise(
          (u, d) => setTimeout(() => d(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      console.log("WebSocket result:", a);
      const r = a;
      if (!r || !r.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq: e, current: this._loadSeq });
        return;
      }
      const s = /* @__PURE__ */ new Map();
      for (const u of r.locations) s.set(u.id, u);
      const l = Array.from(s.values());
      l.length !== r.locations.length && console.warn("[Panel] Deduped locations from backend", {
        before: r.locations.length,
        after: l.length
      });
      const c = l.filter((u) => !u.is_explicit_root);
      c.length !== l.length && console.log("[Panel] Hidden explicit root locations from manager tree", {
        hidden: l.length - c.length
      }), this._locations = [...c], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._locationsVersion += 1, console.log("Loaded locations:", this._locations.length, this._locations), this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((u) => u.id === this._selectedId)) && (this._selectedId = (o = this._locations[0]) == null ? void 0 : o.id);
    } catch (a) {
      console.error("Failed to load locations:", a), this._error = a.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (a == null ? void 0 : a.message) || a);
    } finally {
      this._loading = !1, this.requestUpdate();
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(t) {
    this._selectedId = t.detail.locationId;
  }
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return _`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${(o) => {
      o.preventDefault(), typeof t == "function" ? t("/config/areas") : window.location.href = "/config/areas";
    }}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: t, localName: e, haName: i } = this._renameConflict, o = this._locations.find((a) => a.id === t);
    return _`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(o == null ? void 0 : o.name) || t}" was renamed in Home Assistant to "${i}".
            Your local name is "${e}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
  _handleConflictKeepLocal() {
    if (!this._renameConflict) return;
    const { locationId: t, localName: e } = this._renameConflict;
    console.log(`[Panel] Keeping local name "${e}" for location ${t}`), this._renameConflict = void 0;
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: t, haName: e } = this._renameConflict;
    console.log(`[Panel] Accepting HA name "${e}" for location ${t}`);
    const i = this._locations.find((o) => o.id === t);
    i && (i.name = e, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    console.log("[Panel] Dismissing rename conflict"), this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._handleNewLocation();
  }
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root);
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : "Delete selected location" : "Select a location to delete";
  }
  _handleLocationEdit(t) {
    var o;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = e ? this._locations.find((a) => a.id === e) : this._getSelectedLocation();
    if (!i) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = i, this._newLocationDefaults = void 0, this._locationDialogOpen = !0;
  }
  async _handleLocationMoved(t) {
    t.stopPropagation();
    const { locationId: e, newParentId: i, newIndex: o } = t.detail || {};
    if (!e || typeof o != "number") {
      this._showToast("Invalid move request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/reorder",
            location_id: e,
            new_parent_id: i ?? null,
            new_index: o
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (a) {
        console.error("Failed to move location:", a), this._showToast((a == null ? void 0 : a.message) || "Failed to move location", "error");
      }
    });
  }
  _handleLocationMoveBlocked(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.reason;
    this._showToast(
      typeof e == "string" && e.trim() ? e : "That move is not allowed for this location.",
      "warning"
    );
  }
  async _handleLocationLockToggle(t) {
    var o, a;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((a = t == null ? void 0 : t.detail) != null && a.lock);
    if (!e) {
      this._showToast("Invalid lock request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var r;
      try {
        const s = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: s,
          service_data: this._serviceDataWithEntryId({
            location_id: e,
            source_id: "manual_ui"
          })
        }), this._logEvent("ui", s, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const l = ((r = this._locations.find((c) => c.id === e)) == null ? void 0 : r.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${l}"`, "success");
      } catch (s) {
        console.error("Failed to toggle lock:", s), this._showToast((s == null ? void 0 : s.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if ((a == null ? void 0 : a.device_class) !== "occupancy" || String(a == null ? void 0 : a.location_id) !== String(t)) continue;
      const r = Array.isArray(a == null ? void 0 : a.locked_by) ? a.locked_by.map((s) => String(s)) : [];
      return {
        isLocked: !!(a != null && a.is_locked),
        lockedBy: r
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var o, a;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((a = t == null ? void 0 : t.detail) != null && a.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var u, d;
      const r = this._locations.find((h) => h.id === e), s = (r == null ? void 0 : r.name) || e, { isLocked: l, lockedBy: c } = this._getLocationLockState(e);
      if (l) {
        const h = c.length ? ` (${c.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${s}" is locked${h}.`, "warning");
        return;
      }
      try {
        if (!r) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const h = i ? "trigger" : "vacate_area", p = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const f = (d = (u = r.modules) == null ? void 0 : u.occupancy) == null ? void 0 : d.default_timeout;
          typeof f == "number" && f >= 0 && (p.timeout = Math.floor(f));
        } else
          p.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: h,
          service_data: this._serviceDataWithEntryId(p)
        }), this._logEvent("ui", h, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${s}" as occupied` : `Marked "${s}" as unoccupied (vacated)`,
          "success"
        );
      } catch (h) {
        console.error("Failed to toggle occupancy:", h), this._showToast((h == null ? void 0 : h.message) || "Hey, can't do it.", "error");
      }
    });
  }
  async _handleLocationRenamed(t) {
    t.stopPropagation();
    const { locationId: e, newName: i } = t.detail || {};
    if (!e || !i) {
      this._showToast("Invalid rename request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/update",
            location_id: e,
            changes: { name: String(i) }
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(`Renamed to "${i}"`, "success");
      } catch (o) {
        console.error("Failed to rename location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to rename location", "error");
      }
    });
  }
  async _handleLocationDelete(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.location;
    if (!(e != null && e.id)) {
      this._showToast("Invalid delete request", "error");
      return;
    }
    if (e.is_explicit_root) {
      this._showToast("Home root cannot be deleted", "warning");
      return;
    }
    await this._enqueueLocationOp(e.id, async () => {
      var o;
      try {
        const a = this._selectedId === e.id, r = e.parent_id ?? void 0;
        if (await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: e.id
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, a) {
          const s = (r && this._locations.some((l) => l.id === r) ? r : (o = this._locations[0]) == null ? void 0 : o.id) ?? void 0;
          this._selectedId = s;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (a) {
        console.error("Failed to delete location:", a), this._showToast((a == null ? void 0 : a.message) || "Failed to delete location", "error");
      }
    });
  }
  async _handleLocationDialogSaved(t) {
    const e = t.detail;
    console.log("Location saved from dialog", e);
    const i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${e.name}"` : `Created "${e.name}"`,
        "success"
      );
    } catch (o) {
      console.error("Failed to reload locations:", o), this._showToast(`Failed to reload: ${o.message}`, "error");
    }
  }
  _isSplitStackedLayout() {
    return this.narrow ? !0 : typeof window.matchMedia != "function" ? !1 : window.matchMedia("(max-width: 768px)").matches;
  }
  _clampPanelSplit(t) {
    return Number.isFinite(t) ? Math.min(Ue, Math.max(ze, t)) : Fe;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Oi);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Oi, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _applyPanelSplitFromClientX(t, e = !1) {
    var r;
    const i = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".panel-container");
    if (!i) return;
    const o = i.getBoundingClientRect();
    if (o.width <= 0) return;
    const a = (t - o.left) / o.width;
    this._setPanelSplit(a, e);
  }
  _stopPanelSplitterDrag() {
    this._isResizingPanels = !1, this._panelResizePointerId = void 0, window.removeEventListener("pointermove", this._handlePanelSplitterPointerMove), window.removeEventListener("pointerup", this._handlePanelSplitterPointerUp), window.removeEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection)) {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_updated", (t == null ? void 0 : t.data) || {}), this._scheduleReload(!0);
          },
          "topomation_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_updated events", t), this._logEvent("error", "subscribe failed: topomation_updated", String(t));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var o, a;
            const e = (o = t == null ? void 0 : t.data) == null ? void 0 : o.location_id, i = (a = t == null ? void 0 : t.data) == null ? void 0 : a.occupied;
            !e || typeof i != "boolean" || (this._setOccupancyState(e, i), this._logEvent("ha", "topomation_occupancy_changed", { locationId: e, occupied: i }));
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
      }
      try {
        this._unsubActionsSummary = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_actions_summary", (t == null ? void 0 : t.data) || {});
          },
          "topomation_actions_summary"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_actions_summary events", t), this._logEvent("error", "subscribe failed: topomation_actions_summary", String(t));
      }
      await this._syncStateChangedSubscription();
    }
  }
  _setOccupancyState(t, e) {
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if ((a == null ? void 0 : a.device_class) !== "occupancy") continue;
      const r = a.location_id;
      r && (t[r] = (o == null ? void 0 : o.state) === "on");
    }
    return t;
  }
  async _syncStateChangedSubscription() {
    var t;
    if ((t = this.hass) != null && t.connection) {
      if (!this._eventLogOpen) {
        this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
        return;
      }
      if (!this._unsubStateChanged)
        try {
          this._unsubStateChanged = await this.hass.connection.subscribeEvents(
            (e) => {
              var l, c, u, d, h, p;
              const i = (l = e == null ? void 0 : e.data) == null ? void 0 : l.entity_id;
              if (!i) return;
              const o = (c = e == null ? void 0 : e.data) == null ? void 0 : c.new_state, a = (o == null ? void 0 : o.attributes) || {};
              if (i.startsWith("binary_sensor.") && a.device_class === "occupancy" && a.location_id && this._setOccupancyState(a.location_id, (o == null ? void 0 : o.state) === "on"), !this._shouldTrackEntity(i)) return;
              const r = (d = (u = e == null ? void 0 : e.data) == null ? void 0 : u.new_state) == null ? void 0 : d.state, s = (p = (h = e == null ? void 0 : e.data) == null ? void 0 : h.old_state) == null ? void 0 : p.state;
              this._logEvent("ha", "state_changed", { entityId: i, oldState: s, newState: r });
            },
            "state_changed"
          );
        } catch (e) {
          console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
        }
    }
  }
  _renderEventLog() {
    return _`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0 ? _`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => _`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? _`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(t) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(t) : this._isTrackedEntityInSelectedSubtree(t);
  }
  _isTrackedEntity(t) {
    var i, o;
    const e = /* @__PURE__ */ new Set();
    for (const a of this._locations) {
      for (const s of a.entity_ids || []) e.add(s);
      const r = ((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const s of r) e.add(s.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, o;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const a of this._locations) {
      if (!e.has(a.id)) continue;
      if ((a.entity_ids || []).includes(t) || (((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((s) => s.entity_id === t)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const t = /* @__PURE__ */ new Set();
    if (!this._selectedId) return t;
    t.add(this._selectedId);
    let e = !0;
    for (; e; ) {
      e = !1;
      for (const i of this._locations)
        i.parent_id && t.has(i.parent_id) && !t.has(i.id) && (t.add(i.id), e = !0);
    }
    return t;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const t = this._locations.find((i) => i.id === this._selectedId);
    if (!t) return "selected subtree";
    const e = this._getSelectedSubtreeLocationIds().size;
    return `${t.name} subtree (${e} locations)`;
  }
  _safeStringify(t) {
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  _logEvent(t, e, i) {
    const o = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: t,
      message: e,
      data: i
    };
    this._eventLogEntries = [o, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const e = [
      { key: "Drag", description: "Move location in hierarchy (tree handle)" },
      { key: "Left/Right", description: "Resize panes when splitter is focused" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${e}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((t) => t.id === this._selectedId);
  }
  /**
   * Batch save all pending changes
   * See: docs/history/2026.02.24-frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const t = Array.from(this._pendingChanges.entries()), e = await Promise.allSettled(
      t.map(([o, a]) => this._saveChange(o, a))
    ), i = e.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([o, a], r) => {
      e[r].status === "fulfilled" && this._pendingChanges.delete(o);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(t, e) {
    switch (e.type) {
      case "update":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/update",
          location_id: t,
          changes: e.updated
        }));
        break;
      case "delete":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/delete",
          location_id: t
        }));
        break;
      case "create":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/create",
          ...e.updated
        }));
        break;
    }
  }
  _activeEntryId() {
    var o, a, r, s;
    const t = (a = (o = this.panel) == null ? void 0 : o.config) == null ? void 0 : a.entry_id;
    if (typeof t == "string" && t.trim()) {
      const l = t.trim();
      return this._lastKnownEntryId = l, l;
    }
    const e = (s = (r = this.route) == null ? void 0 : r.path) == null ? void 0 : s.split("?", 2)[1];
    if (e) {
      const l = new URLSearchParams(e).get("entry_id");
      if (l && l.trim()) {
        const c = l.trim();
        return this._lastKnownEntryId = c, c;
      }
    }
    const i = new URLSearchParams(window.location.search).get("entry_id");
    if (i && i.trim()) {
      const l = i.trim();
      return this._lastKnownEntryId = l, l;
    }
    return this._lastKnownEntryId;
  }
  _withEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _showToast(t, e = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: t,
        type: e === "error" ? "error" : void 0,
        duration: e === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i), console.log(`[Toast:${e}] ${t}`);
  }
  async _seedDemoData() {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
};
ye.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  panel: { attribute: !1 },
  route: { attribute: !1 },
  // Internal state
  _locations: { state: !0 },
  _locationsVersion: { state: !0 },
  _selectedId: { state: !0 },
  _loading: { state: !0 },
  _error: { state: !0 },
  _pendingChanges: { state: !0 },
  _saving: { state: !0 },
  _discarding: { state: !0 },
  _locationDialogOpen: { state: !0 },
  _editingLocation: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 },
  _occupancyStateByLocation: { state: !0 },
  _treePanelSplit: { state: !0 },
  _isResizingPanels: { state: !0 }
}, ye.styles = [
  xe,
  Gt`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        --tree-panel-basis: 40%;
        display: flex;
        height: 100%;
        min-width: 0;
      }

      /* Tree Panel defaults to ~40%, now user-resizable via splitter */
      .panel-left {
        flex: 0 0 var(--tree-panel-basis);
        min-width: 300px;
        max-width: calc(100% - 410px);
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .panel-splitter {
        flex: 0 0 10px;
        position: relative;
        cursor: col-resize;
        touch-action: none;
        user-select: none;
      }

      .panel-splitter::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 4px;
        width: 2px;
        background: var(--divider-color);
        transition: background-color 0.15s ease;
      }

      .panel-splitter:hover::before,
      .panel-splitter.dragging::before,
      .panel-splitter:focus-visible::before {
        background: var(--primary-color);
      }

      .panel-splitter:focus-visible {
        outline: none;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          min-width: 280px;
          max-width: calc(100% - 310px);
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1 1 auto;
          min-width: unset;
          max-width: unset;
        }

        .panel-splitter {
          display: none;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .empty-state-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 0 4px 4px 0;
      }

      .empty-state-banner ha-icon {
        flex-shrink: 0;
        color: var(--primary-color);
      }

      .empty-state-banner-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--primary-text-color);
      }

      .empty-state-banner .button {
        flex-shrink: 0;
        text-decoration: none;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
];
let Ze = ye;
if (!customElements.get("topomation-panel"))
  try {
    console.log("[topomation-panel] registering custom element"), customElements.define("topomation-panel", Ze);
  } catch (n) {
    console.error("[topomation-panel] failed to define element", n);
  }
export {
  Ze as TopomationPanel
};
