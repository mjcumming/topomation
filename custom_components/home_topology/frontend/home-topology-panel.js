/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis, q = R.ShadowRoot && (R.ShadyCSS === void 0 || R.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, G = Symbol(), Q = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, t, o) {
    if (this._$cssResult$ = !0, o !== G) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (q && e === void 0) {
      const o = t !== void 0 && t.length === 1;
      o && (e = Q.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && Q.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ve = (s) => new le(typeof s == "string" ? s : s + "", void 0, G), N = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((o, i, r) => o + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + s[r + 1], s[0]);
  return new le(t, s, G);
}, fe = (s, e) => {
  if (q) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const o = document.createElement("style"), i = R.litNonce;
    i !== void 0 && o.setAttribute("nonce", i), o.textContent = t.cssText, s.appendChild(o);
  }
}, ee = q ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const o of e.cssRules) t += o.cssText;
  return ve(t);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: _e, defineProperty: ye, getOwnPropertyDescriptor: $e, getOwnPropertyNames: be, getOwnPropertySymbols: xe, getPrototypeOf: Ae } = Object, f = globalThis, te = f.trustedTypes, we = te ? te.emptyScript : "", z = f.reactiveElementPolyfillSupport, C = (s, e) => s, B = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? we : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, e) {
  let t = s;
  switch (e) {
    case Boolean:
      t = s !== null;
      break;
    case Number:
      t = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(s);
      } catch {
        t = null;
      }
  }
  return t;
} }, he = (s, e) => !_e(s, e), oe = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: he };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), f.litPropertyMetadata ?? (f.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = oe) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const o = Symbol(), i = this.getPropertyDescriptor(e, o, t);
      i !== void 0 && ye(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, o) {
    const { get: i, set: r } = $e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: i, set(n) {
      const c = i == null ? void 0 : i.call(this);
      r == null || r.call(this, n), this.requestUpdate(e, c, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = Ae(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const t = this.properties, o = [...be(t), ...xe(t)];
      for (const i of o) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [o, i] of t) this.elementProperties.set(o, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, o] of this.elementProperties) {
      const i = this._$Eu(t, o);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const o = new Set(e.flat(1 / 0).reverse());
      for (const i of o) t.unshift(ee(i));
    } else e !== void 0 && t.push(ee(e));
    return t;
  }
  static _$Eu(e, t) {
    const o = t.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const o of t.keys()) this.hasOwnProperty(o) && (e.set(o, this[o]), delete this[o]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return fe(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var o;
      return (o = t.hostConnected) == null ? void 0 : o.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var o;
      return (o = t.hostDisconnected) == null ? void 0 : o.call(t);
    });
  }
  attributeChangedCallback(e, t, o) {
    this._$AK(e, o);
  }
  _$ET(e, t) {
    var r;
    const o = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, o);
    if (i !== void 0 && o.reflect === !0) {
      const n = (((r = o.converter) == null ? void 0 : r.toAttribute) !== void 0 ? o.converter : B).toAttribute(t, o.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var r, n;
    const o = this.constructor, i = o._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const c = o.getPropertyOptions(i), a = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((r = c.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? c.converter : B;
      this._$Em = i;
      const l = a.fromAttribute(t, c.type);
      this[i] = l ?? ((n = this._$Ej) == null ? void 0 : n.get(i)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, o) {
    var i;
    if (e !== void 0) {
      const r = this.constructor, n = this[e];
      if (o ?? (o = r.getPropertyOptions(e)), !((o.hasChanged ?? he)(n, t) || o.useDefault && o.reflect && n === ((i = this._$Ej) == null ? void 0 : i.get(e)) && !this.hasAttribute(r._$Eu(e, o)))) return;
      this.C(e, t, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: o, reflect: i, wrapped: r }, n) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), r !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var o;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [r, n] of this._$Ep) this[r] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, n] of i) {
        const { wrapped: c } = n, a = this[r];
        c !== !0 || this._$AL.has(r) || a === void 0 || this.C(r, void 0, n, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (o = this._$EO) == null || o.forEach((i) => {
        var r;
        return (r = i.hostUpdate) == null ? void 0 : r.call(i);
      }), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((o) => {
      var i;
      return (i = o.hostUpdated) == null ? void 0 : i.call(o);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[C("elementProperties")] = /* @__PURE__ */ new Map(), A[C("finalized")] = /* @__PURE__ */ new Map(), z == null || z({ ReactiveElement: A }), (f.reactiveElementVersions ?? (f.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis, M = k.trustedTypes, ie = M ? M.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, pe = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ue = "?" + v, Ee = `<${ue}>`, x = document, T = () => x.createComment(""), P = (s) => s === null || typeof s != "object" && typeof s != "function", K = Array.isArray, Se = (s) => K(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", I = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, se = /-->/g, re = />/g, _ = RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ne = /'/g, ae = /"/g, ge = /^(?:script|style|textarea|title)$/i, Ce = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), h = Ce(1), w = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), ce = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function me(s, e) {
  if (!K(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ie !== void 0 ? ie.createHTML(e) : e;
}
const ke = (s, e) => {
  const t = s.length - 1, o = [];
  let i, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = S;
  for (let c = 0; c < t; c++) {
    const a = s[c];
    let l, u, d = -1, g = 0;
    for (; g < a.length && (n.lastIndex = g, u = n.exec(a), u !== null); ) g = n.lastIndex, n === S ? u[1] === "!--" ? n = se : u[1] !== void 0 ? n = re : u[2] !== void 0 ? (ge.test(u[2]) && (i = RegExp("</" + u[2], "g")), n = _) : u[3] !== void 0 && (n = _) : n === _ ? u[0] === ">" ? (n = i ?? S, d = -1) : u[1] === void 0 ? d = -2 : (d = n.lastIndex - u[2].length, l = u[1], n = u[3] === void 0 ? _ : u[3] === '"' ? ae : ne) : n === ae || n === ne ? n = _ : n === se || n === re ? n = S : (n = _, i = void 0);
    const m = n === _ && s[c + 1].startsWith("/>") ? " " : "";
    r += n === S ? a + Ee : d >= 0 ? (o.push(l), a.slice(0, d) + pe + a.slice(d) + v + m) : a + v + (d === -2 ? c : m);
  }
  return [me(s, r + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class O {
  constructor({ strings: e, _$litType$: t }, o) {
    let i;
    this.parts = [];
    let r = 0, n = 0;
    const c = e.length - 1, a = this.parts, [l, u] = ke(e, t);
    if (this.el = O.createElement(l, o), y.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (i = y.nextNode()) !== null && a.length < c; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const d of i.getAttributeNames()) if (d.endsWith(pe)) {
          const g = u[n++], m = i.getAttribute(d).split(v), L = /([.?@])?(.*)/.exec(g);
          a.push({ type: 1, index: r, name: L[2], strings: m, ctor: L[1] === "." ? Pe : L[1] === "?" ? Oe : L[1] === "@" ? Ue : H }), i.removeAttribute(d);
        } else d.startsWith(v) && (a.push({ type: 6, index: r }), i.removeAttribute(d));
        if (ge.test(i.tagName)) {
          const d = i.textContent.split(v), g = d.length - 1;
          if (g > 0) {
            i.textContent = M ? M.emptyScript : "";
            for (let m = 0; m < g; m++) i.append(d[m], T()), y.nextNode(), a.push({ type: 2, index: ++r });
            i.append(d[g], T());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ue) a.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = i.data.indexOf(v, d + 1)) !== -1; ) a.push({ type: 7, index: r }), d += v.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const o = x.createElement("template");
    return o.innerHTML = e, o;
  }
}
function E(s, e, t = s, o) {
  var n, c;
  if (e === w) return e;
  let i = o !== void 0 ? (n = t._$Co) == null ? void 0 : n[o] : t._$Cl;
  const r = P(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== r && ((c = i == null ? void 0 : i._$AO) == null || c.call(i, !1), r === void 0 ? i = void 0 : (i = new r(s), i._$AT(s, t, o)), o !== void 0 ? (t._$Co ?? (t._$Co = []))[o] = i : t._$Cl = i), i !== void 0 && (e = E(s, i._$AS(s, e.values), i, o)), e;
}
class Te {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: o } = this._$AD, i = ((e == null ? void 0 : e.creationScope) ?? x).importNode(t, !0);
    y.currentNode = i;
    let r = y.nextNode(), n = 0, c = 0, a = o[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let l;
        a.type === 2 ? l = new U(r, r.nextSibling, this, e) : a.type === 1 ? l = new a.ctor(r, a.name, a.strings, this, e) : a.type === 6 && (l = new Le(r, this, e)), this._$AV.push(l), a = o[++c];
      }
      n !== (a == null ? void 0 : a.index) && (r = y.nextNode(), n++);
    }
    return y.currentNode = x, i;
  }
  p(e) {
    let t = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, t), t += o.strings.length - 2) : o._$AI(e[t])), t++;
  }
}
class U {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, o, i) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = o, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = E(this, e, t), P(e) ? e === p || e == null || e === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : e !== this._$AH && e !== w && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Se(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== p && P(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var r;
    const { values: t, _$litType$: o } = e, i = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = O.createElement(me(o.h, o.h[0]), this.options)), o);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === i) this._$AH.p(t);
    else {
      const n = new Te(i, this), c = n.u(this.options);
      n.p(t), this.T(c), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = ce.get(e.strings);
    return t === void 0 && ce.set(e.strings, t = new O(e)), t;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let o, i = 0;
    for (const r of e) i === t.length ? t.push(o = new U(this.O(T()), this.O(T()), this, this.options)) : o = t[i], o._$AI(r), i++;
    i < t.length && (this._$AR(o && o._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var o;
    for ((o = this._$AP) == null ? void 0 : o.call(this, !1, !0, t); e !== this._$AB; ) {
      const i = e.nextSibling;
      e.remove(), e = i;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class H {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, o, i, r) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = r, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = p;
  }
  _$AI(e, t = this, o, i) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) e = E(this, e, t, 0), n = !P(e) || e !== this._$AH && e !== w, n && (this._$AH = e);
    else {
      const c = e;
      let a, l;
      for (e = r[0], a = 0; a < r.length - 1; a++) l = E(this, c[o + a], t, a), l === w && (l = this._$AH[a]), n || (n = !P(l) || l !== this._$AH[a]), l === p ? e = p : e !== p && (e += (l ?? "") + r[a + 1]), this._$AH[a] = l;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Pe extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === p ? void 0 : e;
  }
}
class Oe extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== p);
  }
}
class Ue extends H {
  constructor(e, t, o, i, r) {
    super(e, t, o, i, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = E(this, e, t, 0) ?? p) === w) return;
    const o = this._$AH, i = e === p && o !== p || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, r = e !== p && (o === p || i);
    i && this.element.removeEventListener(this.name, this, o), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Le {
  constructor(e, t, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    E(this, e);
  }
}
const D = k.litHtmlPolyfillSupport;
D == null || D(O, U), (k.litHtmlVersions ?? (k.litHtmlVersions = [])).push("3.3.1");
const Re = (s, e, t) => {
  const o = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = o._$litPart$;
  if (i === void 0) {
    const r = (t == null ? void 0 : t.renderBefore) ?? null;
    o._$litPart$ = i = new U(e.insertBefore(T(), r), r, void 0, t ?? {});
  }
  return i._$AI(s), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $ = globalThis;
class b extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Re(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return w;
  }
}
var de;
b._$litElement$ = !0, b.finalized = !0, (de = $.litElementHydrateSupport) == null || de.call($, { LitElement: b });
const j = $.litElementPolyfillSupport;
j == null || j({ LitElement: b });
($.litElementVersions ?? ($.litElementVersions = [])).push("4.2.1");
const J = N`
  :host {
    --primary-color: var(--primary-color, #1976d2);
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --disabled-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

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
    color: var(--text-secondary-color);
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
    background: var(--primary-color);
    color: white;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--divider-color);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
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
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }
`;
console.log("[ht-location-tree] module loaded");
const Z = class Z extends b {
  constructor() {
    super(...arguments), this.locations = [], this._expandedIds = /* @__PURE__ */ new Set();
  }
  render() {
    if (this._error)
      return h`
        <div class="error-text">Error loading locations: ${this._error}</div>
      `;
    if (!this.locations.length)
      return h`
        <div class="empty-state">
          <div class="empty-state-icon">📍</div>
          <div>No locations yet. Create your first location to get started.</div>
        </div>
      `;
    const e = this._getRootLocations();
    return h`
      <div class="tree-container">
        <div class="actions">
          <button class="button button-primary" @click=${this._handleCreate}>
            + New Location
          </button>
        </div>
        ${e.map((t) => this._renderNode(t))}
      </div>
    `;
  }
  _renderNode(e) {
    const t = this._getChildren(e.id), o = t.length > 0, i = this._expandedIds.has(e.id), r = this.selectedId === e.id;
    return h`
      <div>
        <div
          class="tree-node ${r ? "selected" : ""}"
          @click=${() => this._handleSelect(e.id)}
        >
          <div class="tree-node-content">
            <div
              class="expand-icon ${i ? "expanded" : ""} ${o ? "" : "placeholder"}"
              @click=${(n) => this._handleExpandToggle(n, e.id)}
            >
              ${o ? "▶" : ""}
            </div>
            <div class="location-icon">
              ${this._getLocationIcon(e)}
            </div>
            <div class="location-name">${e.name}</div>
          </div>
        </div>
        ${o && i ? h`
              <div class="tree-children">
                ${t.map((n) => this._renderNode(n))}
              </div>
            ` : ""}
      </div>
    `;
  }
  _getRootLocations() {
    return this.locations.filter(
      (e) => e.parent_id === null || e.is_explicit_root
    );
  }
  _getChildren(e) {
    return this.locations.filter((t) => t.parent_id === e);
  }
  _getLocationIcon(e) {
    const t = e.modules._meta, o = (t == null ? void 0 : t.type) || "room";
    return {
      floor: "≡",
      room: "◎",
      zone: "◇",
      suite: "❖",
      outdoor: "⌂",
      building: "▣"
    }[o] || "◎";
  }
  _handleExpandToggle(e, t) {
    e.stopPropagation();
    const o = new Set(this._expandedIds);
    o.has(t) ? o.delete(t) : o.add(t), this._expandedIds = o;
  }
  _handleSelect(e) {
    this.dispatchEvent(
      new CustomEvent("location-selected", {
        detail: { locationId: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _handleCreate() {
    this.dispatchEvent(
      new CustomEvent("location-create", {
        bubbles: !0,
        composed: !0
      })
    );
  }
};
Z.styles = [
  J,
  N`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-container {
        padding: var(--spacing-md);
      }

      .tree-node {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
      }

      .tree-node:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .tree-node.selected {
        background: var(--primary-color);
        color: white;
      }

      .tree-node.selected:hover {
        background: var(--primary-color);
        opacity: 0.9;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        flex: 1;
        gap: var(--spacing-sm);
      }

      .expand-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--transition-speed);
      }

      .expand-icon.expanded {
        transform: rotate(90deg);
      }

      .expand-icon.placeholder {
        opacity: 0;
      }

      .location-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
      }

      .tree-children {
        margin-left: var(--spacing-lg);
      }

      .actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }
    `
];
let W = Z;
if (!customElements.get("ht-location-tree"))
  try {
    console.log("[ht-location-tree] registering custom element"), customElements.define("ht-location-tree", W);
  } catch (s) {
    console.error("[ht-location-tree] failed to define element", s);
  }
console.log("[ht-location-inspector] module loaded");
const X = class X extends b {
  constructor() {
    super(...arguments), this._activeTab = "occupancy";
  }
  render() {
    return this.location ? h`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()} ${this._renderContent()}
      </div>
    ` : h`
        <div class="empty-state">
          <div class="empty-state-icon">👈</div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  _renderHeader() {
    if (!this.location) return "";
    const e = this.location.modules._meta, t = this._getLocationIcon((e == null ? void 0 : e.type) || "room");
    return h`
      <div class="header">
        <div class="header-icon">${t}</div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">${this.location.id}</div>
        </div>
      </div>
    `;
  }
  _renderTabs() {
    return h`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "occupancy" ? "active" : ""}"
          @click=${() => this._activeTab = "occupancy"}
        >
          Occupancy
        </button>
        <button
          class="tab ${this._activeTab === "actions" ? "active" : ""}"
          @click=${() => this._activeTab = "actions"}
        >
          Actions
        </button>
      </div>
    `;
  }
  _renderContent() {
    return h`
      <div class="tab-content">
        ${this._activeTab === "occupancy" ? this._renderOccupancyTab() : this._renderActionsTab()}
      </div>
    `;
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const e = this.location.modules.occupancy || {}, t = e.enabled ?? !0, o = e.default_timeout || 300;
    return h`
      <div>
        <div class="section-header">PRESENCE LOGIC</div>
        <div class="config-row">
          <div class="config-label">Enable Occupancy Tracking</div>
          <div class="config-value">
            <div class="toggle ${t ? "on" : ""}" @click=${this._toggleEnabled}>
            </div>
          </div>
        </div>

        ${t ? h`
              <div class="config-row">
                <div class="config-label">Default Timeout</div>
                <div class="config-value">
                  <input
                    type="number"
                    class="input"
                    .value=${Math.floor(o / 60)}
                    @change=${this._handleTimeoutChange}
                  />
                  <span class="text-muted">minutes</span>
                </div>
              </div>

              <div class="section-header">OCCUPANCY SOURCES</div>
              <div class="sources-list">
                ${this._renderOccupancySources(e)}
              </div>
            ` : ""}
      </div>
    `;
  }
  _renderOccupancySources(e) {
    const t = e.occupancy_sources || [];
    return t.length ? t.map(
      (o) => h`
        <div class="source-item">
          <div class="source-icon">⊙</div>
          <div class="source-info">
            <div class="source-name">${o.entity_id}</div>
            <div class="source-details">
              ${o.mode === "any_change" ? "Any Change" : "Specific States"}
              ${o.on_timeout ? ` • ${Math.floor(o.on_timeout / 60)}min` : ""}
            </div>
          </div>
          <button class="icon-button">⚙️</button>
        </div>
      `
    ) : h`
        <div class="empty-state">
          <div class="text-muted">
            No occupancy sources configured. Add sensors to track occupancy.
          </div>
          <button class="button button-primary" style="margin-top: 16px;">
            + Add Source
          </button>
        </div>
      `;
  }
  _renderActionsTab() {
    if (!this.location) return "";
    const t = (this.location.modules.automation || {}).rules || [];
    return h`
      <div>
        <div class="section-header">AUTOMATION RULES</div>

        <div class="actions">
          <button class="button button-primary" @click=${this._handleAddRule}>
            + Add Rule
          </button>
        </div>

        <div class="rules-list" style="margin-top: var(--spacing-md);">
          ${t.length === 0 ? h`
                  <div class="empty-state">
                    <div class="text-muted">No automation rules configured.</div>
                  </div>
                ` : t.map(
      (o) => h`
                    <div class="source-item">
                      <div class="source-icon">⚡</div>
                      <div class="source-info">
                        <div class="source-name">${o.name}</div>
                        <div class="source-details">
                          When ${o.trigger_type} → ${o.action_service} (${o.action_entity_id})
                        </div>
                      </div>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(o.id)}>🗑️</button>
                    </div>
                  `
    )}
        </div>
      </div>
    `;
  }
  _handleAddRule() {
    alert("Rule editor dialog coming in next iteration");
  }
  async _handleDeleteRule(e) {
    if (!confirm("Are you sure you want to delete this rule?") || !this.location) return;
    const t = this.location.modules.automation || {}, i = (t.rules || []).filter((r) => r.id !== e);
    await this._updateModuleConfig("automation", { ...t, rules: i });
  }
  async _updateModuleConfig(e, t) {
    if (this.location)
      try {
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: e,
          config: t
        }), this.location.modules[e] = t, this.requestUpdate();
      } catch (o) {
        console.error("Failed to update config:", o), alert("Failed to update configuration");
      }
  }
  _getLocationIcon(e) {
    return {
      floor: "≡",
      room: "◎",
      zone: "◇",
      suite: "❖",
      outdoor: "⌂",
      building: "▣"
    }[e] || "◎";
  }
  _toggleEnabled() {
    if (!this.location) return;
    const e = this.location.modules.occupancy || {}, t = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: t });
  }
  _handleTimeoutChange(e) {
    const t = e.target, i = parseInt(t.value, 10) * 60;
    if (!this.location) return;
    const r = this.location.modules.occupancy || {};
    this._updateConfig({ ...r, default_timeout: i });
  }
  async _updateConfig(e) {
    await this._updateModuleConfig("occupancy", e);
  }
};
X.styles = [
  J,
  N`
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
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .header-icon {
        font-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }

      .location-id {
        font-size: 12px;
        color: var(--text-secondary-color);
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .toggle {
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: var(--disabled-color);
        position: relative;
        cursor: pointer;
        transition: background var(--transition-speed);
      }

      .toggle.on {
        background: var(--primary-color);
      }

      .toggle::after {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform var(--transition-speed);
      }

      .toggle.on::after {
        transform: translateX(20px);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 80px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
      }

      .source-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
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
    `
];
let F = X;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", F);
  } catch (s) {
    console.error("[ht-location-inspector] failed to define element", s);
  }
console.log("[home-topology-panel] module loaded");
const Y = class Y extends b {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._loading = !0, this._hasLoaded = !1, console.log("HomeTopologyPanel constructed");
  }
  willUpdate(e) {
    super.willUpdate(e), !this._hasLoaded && this.hass && (this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations());
  }
  connectedCallback() {
    super.connectedCallback(), console.log("HomeTopologyPanel connected"), this._scheduleInitialLoad();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0);
  }
  render() {
    if (this._loading)
      return h`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return h`
        <div class="error-container">
          <h3>Error Loading Home Topology</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const e = this._locations.find(
      (t) => t.id === this._selectedId
    );
    return h`
      <div class="panel-container">
        <div class="panel-left">
          <div class="header">
            <div class="header-title">Location Manager</div>
            <div class="header-subtitle">Manage your home topology hierarchy.</div>
            <div class="header-actions">
              <button class="button button-primary" @click=${this._handleSaveChanges} disabled>
                Save Changes
              </button>
              <button class="button button-secondary" @click=${this._seedDemoData}>
                ⚡ Seed Demo Data
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .selectedId=${this._selectedId}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header" style="border-bottom: 1px solid var(--divider-color);">
            <div class="header-title">Modules</div>
            <div class="header-subtitle">Configure the selected location.</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${e}
          ></ht-location-inspector>
        </div>
      </div>
    `;
  }
  async _loadLocations() {
    this._loading = !0, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      const e = await Promise.race([
        this.hass.callWS({
          type: "home_topology/locations/list"
        }),
        new Promise(
          (t, o) => setTimeout(() => o(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      this._locations = e.locations, !this._selectedId && this._locations.length > 0 && (this._selectedId = this._locations[0].id);
    } catch (e) {
      console.error("Failed to load locations:", e), this._error = e.message || "Failed to load locations";
    } finally {
      this._loading = !1;
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
  _handleLocationSelected(e) {
    this._selectedId = e.detail.locationId;
  }
  _handleLocationCreate() {
    alert("Create location dialog coming soon");
  }
  _handleSaveChanges() {
    alert("Save Changes coming soon");
  }
  async _seedDemoData() {
    if (!confirm("This will create a demo topology. Continue?")) return;
    const e = [
      { id: "ground_floor", name: "Ground Floor", type: "floor", parent_id: "house" },
      { id: "living_room", name: "Living Room", type: "room", parent_id: "ground_floor" },
      { id: "reading_corner", name: "Reading Corner", type: "zone", parent_id: "living_room" },
      { id: "kitchen", name: "Kitchen", type: "room", parent_id: "ground_floor" },
      { id: "dining_room", name: "Dining Room", type: "room", parent_id: "ground_floor" },
      { id: "hallway", name: "Hallway", type: "room", parent_id: "ground_floor" },
      { id: "office", name: "Office", type: "room", parent_id: "ground_floor" },
      { id: "garage", name: "Garage", type: "room", parent_id: "ground_floor" },
      { id: "first_floor", name: "First Floor", type: "floor", parent_id: "house" },
      { id: "master_suite", name: "Master Suite", type: "suite", parent_id: "first_floor" },
      { id: "master_bedroom", name: "Master Bedroom", type: "room", parent_id: "master_suite" },
      { id: "master_bath", name: "Master Bath", type: "room", parent_id: "master_suite" },
      { id: "kids_room", name: "Kids Room", type: "room", parent_id: "first_floor" },
      { id: "guest_room", name: "Guest Room", type: "room", parent_id: "first_floor" },
      { id: "outdoor", name: "Outdoor", type: "outdoor", parent_id: "house" },
      { id: "patio", name: "Patio", type: "zone", parent_id: "outdoor" },
      { id: "garden", name: "Garden", type: "zone", parent_id: "outdoor" }
    ];
    try {
      this._loading = !0;
      for (const t of e) {
        console.log(`Creating ${t.name}...`);
        try {
          await this.hass.callWS({
            type: "home_topology/locations/create",
            name: t.name,
            parent_id: t.parent_id,
            meta: { type: t.type }
          });
        } catch (o) {
          console.warn(`Failed to create ${t.name} (might exist):`, o);
        }
      }
      await this._loadLocations(), alert("Demo data seeded successfully!");
    } catch (t) {
      console.error("Seeding failed:", t), alert(`Seeding failed: ${t.message}`);
    } finally {
      this._loading = !1;
    }
  }
};
Y.styles = [
  J,
  N`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color, #fafafa);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      .panel-left {
        flex: 0 0 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .panel-right {
        flex: 1;
        background: var(--card-background-color);
        overflow: hidden;
      }

      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
        }
      }

      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .header-title {
        font-size: 22px;
        font-weight: 600;
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

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
      }
    `
];
let V = Y;
if (!customElements.get("home-topology-panel"))
  try {
    console.log("[home-topology-panel] registering custom element"), customElements.define("home-topology-panel", V);
  } catch (s) {
    console.error("[home-topology-panel] failed to define element", s);
  }
export {
  V as HomeTopologyPanel
};
