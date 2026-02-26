/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, Ge = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Je = Symbol(), ri = /* @__PURE__ */ new WeakMap();
let zi = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== Je) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Ge && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = ri.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && ri.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const vo = (a) => new zi(typeof a == "string" ? a : a + "", void 0, Je), Gt = (a, ...t) => {
  const e = a.length === 1 ? a[0] : t.reduce((i, o, n) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + a[n + 1], a[0]);
  return new zi(e, a, Je);
}, bo = (a, t) => {
  if (Ge) a.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = ne.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, a.appendChild(i);
  }
}, si = Ge ? (a) => a : (a) => a instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return vo(e);
})(a) : a;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: yo, defineProperty: wo, getOwnPropertyDescriptor: xo, getOwnPropertyNames: So, getOwnPropertySymbols: $o, getPrototypeOf: Ao } = Object, rt = globalThis, ci = rt.trustedTypes, Eo = ci ? ci.emptyScript : "", Ae = rt.reactiveElementPolyfillSupport, zt = (a, t) => a, Fe = { toAttribute(a, t) {
  switch (t) {
    case Boolean:
      a = a ? Eo : null;
      break;
    case Object:
    case Array:
      a = a == null ? a : JSON.stringify(a);
  }
  return a;
}, fromAttribute(a, t) {
  let e = a;
  switch (t) {
    case Boolean:
      e = a !== null;
      break;
    case Number:
      e = a === null ? null : Number(a);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(a);
      } catch {
        e = null;
      }
  }
  return e;
} }, Ui = (a, t) => !yo(a, t), li = { attribute: !0, type: String, converter: Fe, reflect: !1, useDefault: !1, hasChanged: Ui };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), rt.litPropertyMetadata ?? (rt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let St = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = li) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && wo(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: n } = xo(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: o, set(r) {
      const s = o == null ? void 0 : o.call(this);
      n == null || n.call(this, r), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? li;
  }
  static _$Ei() {
    if (this.hasOwnProperty(zt("elementProperties"))) return;
    const t = Ao(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(zt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(zt("properties"))) {
      const e = this.properties, i = [...So(e), ...$o(e)];
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
      for (const o of i) e.unshift(si(o));
    } else t !== void 0 && e.push(si(t));
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
    return bo(t, this.constructor.elementStyles), t;
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
    var n;
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const r = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : Fe).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, r;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = i.getPropertyOptions(o), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((n = s.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? s.converter : Fe;
      this._$Em = o;
      const l = c.fromAttribute(e, s.type);
      this[o] = l ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var o;
    if (t !== void 0) {
      const n = this.constructor, r = this[t];
      if (i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? Ui)(r, e) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: n }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), n !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [n, r] of o) {
        const { wrapped: s } = r, c = this[n];
        s !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, r, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((o) => {
        var n;
        return (n = o.hostUpdate) == null ? void 0 : n.call(o);
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
St.elementStyles = [], St.shadowRootOptions = { mode: "open" }, St[zt("elementProperties")] = /* @__PURE__ */ new Map(), St[zt("finalized")] = /* @__PURE__ */ new Map(), Ae == null || Ae({ ReactiveElement: St }), (rt.reactiveElementVersions ?? (rt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, he = Ut.trustedTypes, di = he ? he.createPolicy("lit-html", { createHTML: (a) => a }) : void 0, Hi = "$lit$", it = `lit$${Math.random().toFixed(9).slice(2)}$`, qi = "?" + it, ko = `<${qi}>`, yt = document, jt = () => yt.createComment(""), Yt = (a) => a === null || typeof a != "object" && typeof a != "function", Qe = Array.isArray, To = (a) => Qe(a) || typeof (a == null ? void 0 : a[Symbol.iterator]) == "function", Ee = `[ 	
\f\r]`, Rt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ui = /-->/g, hi = />/g, ht = RegExp(`>|${Ee}(?:([^\\s"'>=/]+)(${Ee}*=${Ee}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), pi = /'/g, fi = /"/g, Wi = /^(?:script|style|textarea|title)$/i, Do = (a) => (t, ...e) => ({ _$litType$: a, strings: t, values: e }), _ = Do(1), K = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), gi = /* @__PURE__ */ new WeakMap(), vt = yt.createTreeWalker(yt, 129);
function Ki(a, t) {
  if (!Qe(a) || !a.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return di !== void 0 ? di.createHTML(t) : t;
}
const Co = (a, t) => {
  const e = a.length - 1, i = [];
  let o, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = Rt;
  for (let s = 0; s < e; s++) {
    const c = a[s];
    let l, u, d = -1, h = 0;
    for (; h < c.length && (r.lastIndex = h, u = r.exec(c), u !== null); ) h = r.lastIndex, r === Rt ? u[1] === "!--" ? r = ui : u[1] !== void 0 ? r = hi : u[2] !== void 0 ? (Wi.test(u[2]) && (o = RegExp("</" + u[2], "g")), r = ht) : u[3] !== void 0 && (r = ht) : r === ht ? u[0] === ">" ? (r = o ?? Rt, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, l = u[1], r = u[3] === void 0 ? ht : u[3] === '"' ? fi : pi) : r === fi || r === pi ? r = ht : r === ui || r === hi ? r = Rt : (r = ht, o = void 0);
    const p = r === ht && a[s + 1].startsWith("/>") ? " " : "";
    n += r === Rt ? c + ko : d >= 0 ? (i.push(l), c.slice(0, d) + Hi + c.slice(d) + it + p) : c + it + (d === -2 ? s : p);
  }
  return [Ki(a, n + (a[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Xt {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let n = 0, r = 0;
    const s = t.length - 1, c = this.parts, [l, u] = Co(t, e);
    if (this.el = Xt.createElement(l, i), vt.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = vt.nextNode()) !== null && c.length < s; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(Hi)) {
          const h = u[r++], p = o.getAttribute(d).split(it), f = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: n, name: f[2], strings: p, ctor: f[1] === "." ? Oo : f[1] === "?" ? Mo : f[1] === "@" ? Io : xe }), o.removeAttribute(d);
        } else d.startsWith(it) && (c.push({ type: 6, index: n }), o.removeAttribute(d));
        if (Wi.test(o.tagName)) {
          const d = o.textContent.split(it), h = d.length - 1;
          if (h > 0) {
            o.textContent = he ? he.emptyScript : "";
            for (let p = 0; p < h; p++) o.append(d[p], jt()), vt.nextNode(), c.push({ type: 2, index: ++n });
            o.append(d[h], jt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === qi) c.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(it, d + 1)) !== -1; ) c.push({ type: 7, index: n }), d += it.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = yt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function kt(a, t, e = a, i) {
  var r, s;
  if (t === K) return t;
  let o = i !== void 0 ? (r = e._$Co) == null ? void 0 : r[i] : e._$Cl;
  const n = Yt(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== n && ((s = o == null ? void 0 : o._$AO) == null || s.call(o, !1), n === void 0 ? o = void 0 : (o = new n(a), o._$AT(a, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = kt(a, o._$AS(a, t.values), o, i)), t;
}
let Lo = class {
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
    let n = vt.nextNode(), r = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let l;
        c.type === 2 ? l = new Dt(n, n.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(n, c.name, c.strings, this, t) : c.type === 6 && (l = new Ro(n, this, t)), this._$AV.push(l), c = i[++s];
      }
      r !== (c == null ? void 0 : c.index) && (n = vt.nextNode(), r++);
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
    t = kt(this, t, e), Yt(t) ? t === O || t == null || t === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : t !== this._$AH && t !== K && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : To(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== O && Yt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(yt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Xt.createElement(Ki(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === o) this._$AH.p(e);
    else {
      const r = new Lo(o, this), s = r.u(this.options);
      r.p(e), this.T(s), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = gi.get(t.strings);
    return e === void 0 && gi.set(t.strings, e = new Xt(t)), e;
  }
  k(t) {
    Qe(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const n of t) o === e.length ? e.push(i = new Dt(this.O(jt()), this.O(jt()), this, this.options)) : i = e[o], i._$AI(n), o++;
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
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, o, n) {
    this.type = 1, this._$AH = O, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = O;
  }
  _$AI(t, e = this, i, o) {
    const n = this.strings;
    let r = !1;
    if (n === void 0) t = kt(this, t, e, 0), r = !Yt(t) || t !== this._$AH && t !== K, r && (this._$AH = t);
    else {
      const s = t;
      let c, l;
      for (t = n[0], c = 0; c < n.length - 1; c++) l = kt(this, s[i + c], e, c), l === K && (l = this._$AH[c]), r || (r = !Yt(l) || l !== this._$AH[c]), l === O ? t = O : t !== O && (t += (l ?? "") + n[c + 1]), this._$AH[c] = l;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Oo extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === O ? void 0 : t;
  }
}
class Mo extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== O);
  }
}
class Io extends xe {
  constructor(t, e, i, o, n) {
    super(t, e, i, o, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = kt(this, t, e, 0) ?? O) === K) return;
    const i = this._$AH, o = t === O && i !== O || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== O && (i === O || o);
    o && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ro {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    kt(this, t);
  }
}
const Po = { I: Dt }, ke = Ut.litHtmlPolyfillSupport;
ke == null || ke(Xt, Dt), (Ut.litHtmlVersions ?? (Ut.litHtmlVersions = [])).push("3.3.1");
const No = (a, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new Dt(t.insertBefore(jt(), n), n, void 0, e ?? {});
  }
  return o._$AI(a), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bt = globalThis;
let st = class extends St {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = No(e, this.renderRoot, this.renderOptions);
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
    return K;
  }
};
var Mi;
st._$litElement$ = !0, st.finalized = !0, (Mi = bt.litElementHydrateSupport) == null || Mi.call(bt, { LitElement: st });
const Te = bt.litElementPolyfillSupport;
Te == null || Te({ LitElement: st });
(bt.litElementVersions ?? (bt.litElementVersions = [])).push("4.2.1");
const Se = Gt`
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
const mt = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Vi = (a) => (...t) => ({ _$litDirective$: a, values: t });
class ji {
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
const { I: Bo } = Po, Fo = (a) => a.strings === void 0, mi = () => document.createComment(""), Pt = (a, t, e) => {
  var n;
  const i = a._$AA.parentNode, o = t === void 0 ? a._$AB : t._$AA;
  if (e === void 0) {
    const r = i.insertBefore(mi(), o), s = i.insertBefore(mi(), o);
    e = new Bo(r, s, a, a.options);
  } else {
    const r = e._$AB.nextSibling, s = e._$AM, c = s !== a;
    if (c) {
      let l;
      (n = e._$AQ) == null || n.call(e, a), e._$AM = a, e._$AP !== void 0 && (l = a._$AU) !== s._$AU && e._$AP(l);
    }
    if (r !== o || c) {
      let l = e._$AA;
      for (; l !== r; ) {
        const u = l.nextSibling;
        i.insertBefore(l, o), l = u;
      }
    }
  }
  return e;
}, pt = (a, t, e = a) => (a._$AI(t, e), a), zo = {}, Yi = (a, t = zo) => a._$AH = t, Uo = (a) => a._$AH, De = (a) => {
  a._$AR(), a._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _i = (a, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = t; o <= e; o++) i.set(a[o], o);
  return i;
}, Ho = Vi(class extends ji {
  constructor(a) {
    if (super(a), a.type !== mt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(a, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const o = [], n = [];
    let r = 0;
    for (const s of a) o[r] = i ? i(s, r) : r, n[r] = e(s, r), r++;
    return { values: n, keys: o };
  }
  render(a, t, e) {
    return this.dt(a, t, e).values;
  }
  update(a, [t, e, i]) {
    const o = Uo(a), { values: n, keys: r } = this.dt(t, e, i);
    if (!Array.isArray(o)) return this.ut = r, n;
    const s = this.ut ?? (this.ut = []), c = [];
    let l, u, d = 0, h = o.length - 1, p = 0, f = n.length - 1;
    for (; d <= h && p <= f; ) if (o[d] === null) d++;
    else if (o[h] === null) h--;
    else if (s[d] === r[p]) c[p] = pt(o[d], n[p]), d++, p++;
    else if (s[h] === r[f]) c[f] = pt(o[h], n[f]), h--, f--;
    else if (s[d] === r[f]) c[f] = pt(o[d], n[f]), Pt(a, c[f + 1], o[d]), d++, f--;
    else if (s[h] === r[p]) c[p] = pt(o[h], n[p]), Pt(a, o[d], o[h]), h--, p++;
    else if (l === void 0 && (l = _i(r, p, f), u = _i(s, d, h)), l.has(s[d])) if (l.has(s[h])) {
      const m = u.get(r[p]), v = m !== void 0 ? o[m] : null;
      if (v === null) {
        const $ = Pt(a, o[d]);
        pt($, n[p]), c[p] = $;
      } else c[p] = pt(v, n[p]), Pt(a, o[d], v), o[m] = null;
      p++;
    } else De(o[h]), h--;
    else De(o[d]), d++;
    for (; p <= f; ) {
      const m = Pt(a, c[f + 1]);
      pt(m, n[p]), c[p++] = m;
    }
    for (; d <= h; ) {
      const m = o[d++];
      m !== null && De(m);
    }
    return this.ut = r, Yi(a, c), K;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function vi(a, t) {
  var e = Object.keys(a);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(a);
    t && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(a, o).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function Y(a) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? vi(Object(e), !0).forEach(function(i) {
      qo(a, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a, Object.getOwnPropertyDescriptors(e)) : vi(Object(e)).forEach(function(i) {
      Object.defineProperty(a, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return a;
}
function ae(a) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ae = function(t) {
    return typeof t;
  } : ae = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ae(a);
}
function qo(a, t, e) {
  return t in a ? Object.defineProperty(a, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : a[t] = e, a;
}
function J() {
  return J = Object.assign || function(a) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (a[i] = e[i]);
    }
    return a;
  }, J.apply(this, arguments);
}
function Wo(a, t) {
  if (a == null) return {};
  var e = {}, i = Object.keys(a), o, n;
  for (n = 0; n < i.length; n++)
    o = i[n], !(t.indexOf(o) >= 0) && (e[o] = a[o]);
  return e;
}
function Ko(a, t) {
  if (a == null) return {};
  var e = Wo(a, t), i, o;
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(a);
    for (o = 0; o < n.length; o++)
      i = n[o], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(a, i) && (e[i] = a[i]);
  }
  return e;
}
var Vo = "1.15.6";
function G(a) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(a);
}
var Q = G(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Jt = G(/Edge/i), bi = G(/firefox/i), Ht = G(/safari/i) && !G(/chrome/i) && !G(/android/i), Ze = G(/iP(ad|od|hone)/i), Xi = G(/chrome/i) && G(/android/i), Gi = {
  capture: !1,
  passive: !1
};
function S(a, t, e) {
  a.addEventListener(t, e, !Q && Gi);
}
function x(a, t, e) {
  a.removeEventListener(t, e, !Q && Gi);
}
function pe(a, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), a)
      try {
        if (a.matches)
          return a.matches(t);
        if (a.msMatchesSelector)
          return a.msMatchesSelector(t);
        if (a.webkitMatchesSelector)
          return a.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Ji(a) {
  return a.host && a !== document && a.host.nodeType ? a.host : a.parentNode;
}
function W(a, t, e, i) {
  if (a) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? a.parentNode === e && pe(a, t) : pe(a, t)) || i && a === e)
        return a;
      if (a === e) break;
    } while (a = Ji(a));
  }
  return null;
}
var yi = /\s+/g;
function z(a, t, e) {
  if (a && t)
    if (a.classList)
      a.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + a.className + " ").replace(yi, " ").replace(" " + t + " ", " ");
      a.className = (i + (e ? " " + t : "")).replace(yi, " ");
    }
}
function b(a, t, e) {
  var i = a && a.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(a, "") : a.currentStyle && (e = a.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Et(a, t) {
  var e = "";
  if (typeof a == "string")
    e = a;
  else
    do {
      var i = b(a, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (a = a.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(e);
}
function Qi(a, t, e) {
  if (a) {
    var i = a.getElementsByTagName(t), o = 0, n = i.length;
    if (e)
      for (; o < n; o++)
        e(i[o], o);
    return i;
  }
  return [];
}
function j() {
  var a = document.scrollingElement;
  return a || document.documentElement;
}
function L(a, t, e, i, o) {
  if (!(!a.getBoundingClientRect && a !== window)) {
    var n, r, s, c, l, u, d;
    if (a !== window && a.parentNode && a !== j() ? (n = a.getBoundingClientRect(), r = n.top, s = n.left, c = n.bottom, l = n.right, u = n.height, d = n.width) : (r = 0, s = 0, c = window.innerHeight, l = window.innerWidth, u = window.innerHeight, d = window.innerWidth), (t || e) && a !== window && (o = o || a.parentNode, !Q))
      do
        if (o && o.getBoundingClientRect && (b(o, "transform") !== "none" || e && b(o, "position") !== "static")) {
          var h = o.getBoundingClientRect();
          r -= h.top + parseInt(b(o, "border-top-width")), s -= h.left + parseInt(b(o, "border-left-width")), c = r + n.height, l = s + n.width;
          break;
        }
      while (o = o.parentNode);
    if (i && a !== window) {
      var p = Et(o || a), f = p && p.a, m = p && p.d;
      p && (r /= m, s /= f, d /= f, u /= m, c = r + u, l = s + d);
    }
    return {
      top: r,
      left: s,
      bottom: c,
      right: l,
      width: d,
      height: u
    };
  }
}
function wi(a, t, e) {
  for (var i = at(a, !0), o = L(a)[t]; i; ) {
    var n = L(i)[e], r = void 0;
    if (r = o >= n, !r) return i;
    if (i === j()) break;
    i = at(i, !1);
  }
  return !1;
}
function Tt(a, t, e, i) {
  for (var o = 0, n = 0, r = a.children; n < r.length; ) {
    if (r[n].style.display !== "none" && r[n] !== y.ghost && (i || r[n] !== y.dragged) && W(r[n], e.draggable, a, !1)) {
      if (o === t)
        return r[n];
      o++;
    }
    n++;
  }
  return null;
}
function ti(a, t) {
  for (var e = a.lastElementChild; e && (e === y.ghost || b(e, "display") === "none" || t && !pe(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function H(a, t) {
  var e = 0;
  if (!a || !a.parentNode)
    return -1;
  for (; a = a.previousElementSibling; )
    a.nodeName.toUpperCase() !== "TEMPLATE" && a !== y.clone && (!t || pe(a, t)) && e++;
  return e;
}
function xi(a) {
  var t = 0, e = 0, i = j();
  if (a)
    do {
      var o = Et(a), n = o.a, r = o.d;
      t += a.scrollLeft * n, e += a.scrollTop * r;
    } while (a !== i && (a = a.parentNode));
  return [t, e];
}
function jo(a, t) {
  for (var e in a)
    if (a.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === a[e][i]) return Number(e);
    }
  return -1;
}
function at(a, t) {
  if (!a || !a.getBoundingClientRect) return j();
  var e = a, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var o = b(e);
      if (e.clientWidth < e.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return j();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return j();
}
function Yo(a, t) {
  if (a && t)
    for (var e in t)
      t.hasOwnProperty(e) && (a[e] = t[e]);
  return a;
}
function Ce(a, t) {
  return Math.round(a.top) === Math.round(t.top) && Math.round(a.left) === Math.round(t.left) && Math.round(a.height) === Math.round(t.height) && Math.round(a.width) === Math.round(t.width);
}
var qt;
function Zi(a, t) {
  return function() {
    if (!qt) {
      var e = arguments, i = this;
      e.length === 1 ? a.call(i, e[0]) : a.apply(i, e), qt = setTimeout(function() {
        qt = void 0;
      }, t);
    }
  };
}
function Xo() {
  clearTimeout(qt), qt = void 0;
}
function to(a, t, e) {
  a.scrollLeft += t, a.scrollTop += e;
}
function eo(a) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(a).cloneNode(!0) : e ? e(a).clone(!0)[0] : a.cloneNode(!0);
}
function io(a, t, e) {
  var i = {};
  return Array.from(a.children).forEach(function(o) {
    var n, r, s, c;
    if (!(!W(o, t.draggable, a, !1) || o.animated || o === e)) {
      var l = L(o);
      i.left = Math.min((n = i.left) !== null && n !== void 0 ? n : 1 / 0, l.left), i.top = Math.min((r = i.top) !== null && r !== void 0 ? r : 1 / 0, l.top), i.right = Math.max((s = i.right) !== null && s !== void 0 ? s : -1 / 0, l.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, l.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var B = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function Go() {
  var a = [], t;
  return {
    captureAnimationState: function() {
      if (a = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(b(o, "display") === "none" || o === y.ghost)) {
            a.push({
              target: o,
              rect: L(o)
            });
            var n = Y({}, a[a.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = Et(o, !0);
              r && (n.top -= r.f, n.left -= r.e);
            }
            o.fromRect = n;
          }
        });
      }
    },
    addAnimationState: function(i) {
      a.push(i);
    },
    removeAnimationState: function(i) {
      a.splice(jo(a, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var n = !1, r = 0;
      a.forEach(function(s) {
        var c = 0, l = s.target, u = l.fromRect, d = L(l), h = l.prevFromRect, p = l.prevToRect, f = s.rect, m = Et(l, !0);
        m && (d.top -= m.f, d.left -= m.e), l.toRect = d, l.thisAnimationDuration && Ce(h, d) && !Ce(u, d) && // Make sure animatingRect is on line between toRect & fromRect
        (f.top - d.top) / (f.left - d.left) === (u.top - d.top) / (u.left - d.left) && (c = Qo(f, h, p, o.options)), Ce(d, u) || (l.prevFromRect = u, l.prevToRect = d, c || (c = o.options.animation), o.animate(l, f, d, c)), c && (n = !0, r = Math.max(r, c), clearTimeout(l.animationResetTimer), l.animationResetTimer = setTimeout(function() {
          l.animationTime = 0, l.prevFromRect = null, l.fromRect = null, l.prevToRect = null, l.thisAnimationDuration = null;
        }, c), l.thisAnimationDuration = c);
      }), clearTimeout(t), n ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, r) : typeof i == "function" && i(), a = [];
    },
    animate: function(i, o, n, r) {
      if (r) {
        b(i, "transition", ""), b(i, "transform", "");
        var s = Et(this.el), c = s && s.a, l = s && s.d, u = (o.left - n.left) / (c || 1), d = (o.top - n.top) / (l || 1);
        i.animatingX = !!u, i.animatingY = !!d, b(i, "transform", "translate3d(" + u + "px," + d + "px,0)"), this.forRepaintDummy = Jo(i), b(i, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")), b(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          b(i, "transition", ""), b(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, r);
      }
    }
  };
}
function Jo(a) {
  return a.offsetWidth;
}
function Qo(a, t, e, i) {
  return Math.sqrt(Math.pow(t.top - a.top, 2) + Math.pow(t.left - a.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var wt = [], Le = {
  initializeByDefault: !0
}, Qt = {
  mount: function(t) {
    for (var e in Le)
      Le.hasOwnProperty(e) && !(e in t) && (t[e] = Le[e]);
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
    var n = t + "Global";
    wt.forEach(function(r) {
      e[r.pluginName] && (e[r.pluginName][n] && e[r.pluginName][n](Y({
        sortable: e
      }, i)), e.options[r.pluginName] && e[r.pluginName][t] && e[r.pluginName][t](Y({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, o) {
    wt.forEach(function(s) {
      var c = s.pluginName;
      if (!(!t.options[c] && !s.initializeByDefault)) {
        var l = new s(t, e, t.options);
        l.sortable = t, l.options = t.options, t[c] = l, J(i, l.defaults);
      }
    });
    for (var n in t.options)
      if (t.options.hasOwnProperty(n)) {
        var r = this.modifyOption(t, n, t.options[n]);
        typeof r < "u" && (t.options[n] = r);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return wt.forEach(function(o) {
      typeof o.eventProperties == "function" && J(i, o.eventProperties.call(e[o.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var o;
    return wt.forEach(function(n) {
      t[n.pluginName] && n.optionListeners && typeof n.optionListeners[e] == "function" && (o = n.optionListeners[e].call(t[n.pluginName], i));
    }), o;
  }
};
function Zo(a) {
  var t = a.sortable, e = a.rootEl, i = a.name, o = a.targetEl, n = a.cloneEl, r = a.toEl, s = a.fromEl, c = a.oldIndex, l = a.newIndex, u = a.oldDraggableIndex, d = a.newDraggableIndex, h = a.originalEvent, p = a.putSortable, f = a.extraEventProperties;
  if (t = t || e && e[B], !!t) {
    var m, v = t.options, $ = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !Q && !Jt ? m = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (m = document.createEvent("Event"), m.initEvent(i, !0, !0)), m.to = r || e, m.from = s || e, m.item = o || e, m.clone = n, m.oldIndex = c, m.newIndex = l, m.oldDraggableIndex = u, m.newDraggableIndex = d, m.originalEvent = h, m.pullMode = p ? p.lastPutMode : void 0;
    var A = Y(Y({}, f), Qt.getEventProperties(i, t));
    for (var M in A)
      m[M] = A[M];
    e && e.dispatchEvent(m), v[$] && v[$].call(t, m);
  }
}
var tn = ["evt"], N = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, n = Ko(i, tn);
  Qt.pluginEvent.bind(y)(t, e, Y({
    dragEl: g,
    parentEl: D,
    ghostEl: w,
    rootEl: k,
    nextEl: _t,
    lastDownEl: re,
    cloneEl: T,
    cloneHidden: ot,
    dragStarted: Nt,
    putSortable: I,
    activeSortable: y.active,
    originalEvent: o,
    oldIndex: At,
    oldDraggableIndex: Wt,
    newIndex: U,
    newDraggableIndex: et,
    hideGhostForTarget: ro,
    unhideGhostForTarget: so,
    cloneNowHidden: function() {
      ot = !0;
    },
    cloneNowShown: function() {
      ot = !1;
    },
    dispatchSortableEvent: function(s) {
      P({
        sortable: e,
        name: s,
        originalEvent: o
      });
    }
  }, n));
};
function P(a) {
  Zo(Y({
    putSortable: I,
    cloneEl: T,
    targetEl: g,
    rootEl: k,
    oldIndex: At,
    oldDraggableIndex: Wt,
    newIndex: U,
    newDraggableIndex: et
  }, a));
}
var g, D, w, k, _t, re, T, ot, At, U, Wt, et, te, I, $t = !1, fe = !1, ge = [], ft, q, Oe, Me, Si, $i, Nt, xt, Kt, Vt = !1, ee = !1, se, R, Ie = [], ze = !1, me = [], $e = typeof document < "u", ie = Ze, Ai = Jt || Q ? "cssFloat" : "float", en = $e && !Xi && !Ze && "draggable" in document.createElement("div"), oo = function() {
  if ($e) {
    if (Q)
      return !1;
    var a = document.createElement("x");
    return a.style.cssText = "pointer-events:auto", a.style.pointerEvents === "auto";
  }
}(), no = function(t, e) {
  var i = b(t), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), n = Tt(t, 0, e), r = Tt(t, 1, e), s = n && b(n), c = r && b(r), l = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + L(n).width, u = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + L(r).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (n && s.float && s.float !== "none") {
    var d = s.float === "left" ? "left" : "right";
    return r && (c.clear === "both" || c.clear === d) ? "vertical" : "horizontal";
  }
  return n && (s.display === "block" || s.display === "flex" || s.display === "table" || s.display === "grid" || l >= o && i[Ai] === "none" || r && i[Ai] === "none" && l + u > o) ? "vertical" : "horizontal";
}, on = function(t, e, i) {
  var o = i ? t.left : t.top, n = i ? t.right : t.bottom, r = i ? t.width : t.height, s = i ? e.left : e.top, c = i ? e.right : e.bottom, l = i ? e.width : e.height;
  return o === s || n === c || o + r / 2 === s + l / 2;
}, nn = function(t, e) {
  var i;
  return ge.some(function(o) {
    var n = o[B].options.emptyInsertThreshold;
    if (!(!n || ti(o))) {
      var r = L(o), s = t >= r.left - n && t <= r.right + n, c = e >= r.top - n && e <= r.bottom + n;
      if (s && c)
        return i = o;
    }
  }), i;
}, ao = function(t) {
  function e(n, r) {
    return function(s, c, l, u) {
      var d = s.options.group.name && c.options.group.name && s.options.group.name === c.options.group.name;
      if (n == null && (r || d))
        return !0;
      if (n == null || n === !1)
        return !1;
      if (r && n === "clone")
        return n;
      if (typeof n == "function")
        return e(n(s, c, l, u), r)(s, c, l, u);
      var h = (r ? s : c).options.group.name;
      return n === !0 || typeof n == "string" && n === h || n.join && n.indexOf(h) > -1;
    };
  }
  var i = {}, o = t.group;
  (!o || ae(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = e(o.pull, !0), i.checkPut = e(o.put), i.revertClone = o.revertClone, t.group = i;
}, ro = function() {
  !oo && w && b(w, "display", "none");
}, so = function() {
  !oo && w && b(w, "display", "");
};
$e && !Xi && document.addEventListener("click", function(a) {
  if (fe)
    return a.preventDefault(), a.stopPropagation && a.stopPropagation(), a.stopImmediatePropagation && a.stopImmediatePropagation(), fe = !1, !1;
}, !0);
var gt = function(t) {
  if (g) {
    t = t.touches ? t.touches[0] : t;
    var e = nn(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var o in t)
        t.hasOwnProperty(o) && (i[o] = t[o]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[B]._onDragOver(i);
    }
  }
}, an = function(t) {
  g && g.parentNode[B]._isOutsideThisEl(t.target);
};
function y(a, t) {
  if (!(a && a.nodeType && a.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(a));
  this.el = a, this.options = t = J({}, t), a[B] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(a.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return no(a, this.options);
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
    supportPointer: y.supportPointer !== !1 && "PointerEvent" in window && (!Ht || Ze),
    emptyInsertThreshold: 5
  };
  Qt.initializePlugins(this, a, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  ao(t);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : en, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? S(a, "pointerdown", this._onTapStart) : (S(a, "mousedown", this._onTapStart), S(a, "touchstart", this._onTapStart)), this.nativeDraggable && (S(a, "dragover", this), S(a, "dragenter", this)), ge.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), J(this, Go());
}
y.prototype = /** @lends Sortable.prototype */
{
  constructor: y,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (xt = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, g) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, o = this.options, n = o.preventOnFilter, r = t.type, s = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (s || t).target, l = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, u = o.filter;
      if (pn(i), !g && !(/mousedown|pointerdown/.test(r) && t.button !== 0 || o.disabled) && !l.isContentEditable && !(!this.nativeDraggable && Ht && c && c.tagName.toUpperCase() === "SELECT") && (c = W(c, o.draggable, i, !1), !(c && c.animated) && re !== c)) {
        if (At = H(c), Wt = H(c, o.draggable), typeof u == "function") {
          if (u.call(this, t, c, this)) {
            P({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), N("filter", e, {
              evt: t
            }), n && t.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(d) {
          if (d = W(l, d.trim(), i, !1), d)
            return P({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), N("filter", e, {
              evt: t
            }), !0;
        }), u)) {
          n && t.preventDefault();
          return;
        }
        o.handle && !W(l, o.handle, i, !1) || this._prepareDragStart(t, s, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var o = this, n = o.el, r = o.options, s = n.ownerDocument, c;
    if (i && !g && i.parentNode === n) {
      var l = L(i);
      if (k = n, g = i, D = g.parentNode, _t = g.nextSibling, re = i, te = r.group, y.dragged = g, ft = {
        target: g,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, Si = ft.clientX - l.left, $i = ft.clientY - l.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, g.style["will-change"] = "all", c = function() {
        if (N("delayEnded", o, {
          evt: t
        }), y.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !bi && o.nativeDraggable && (g.draggable = !0), o._triggerDragStart(t, e), P({
          sortable: o,
          name: "choose",
          originalEvent: t
        }), z(g, r.chosenClass, !0);
      }, r.ignore.split(",").forEach(function(u) {
        Qi(g, u.trim(), Re);
      }), S(s, "dragover", gt), S(s, "mousemove", gt), S(s, "touchmove", gt), r.supportPointer ? (S(s, "pointerup", o._onDrop), !this.nativeDraggable && S(s, "pointercancel", o._onDrop)) : (S(s, "mouseup", o._onDrop), S(s, "touchend", o._onDrop), S(s, "touchcancel", o._onDrop)), bi && this.nativeDraggable && (this.options.touchStartThreshold = 4, g.draggable = !0), N("delayStart", this, {
        evt: t
      }), r.delay && (!r.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Jt || Q))) {
        if (y.eventCanceled) {
          this._onDrop();
          return;
        }
        r.supportPointer ? (S(s, "pointerup", o._disableDelayedDrag), S(s, "pointercancel", o._disableDelayedDrag)) : (S(s, "mouseup", o._disableDelayedDrag), S(s, "touchend", o._disableDelayedDrag), S(s, "touchcancel", o._disableDelayedDrag)), S(s, "mousemove", o._delayedDragTouchMoveHandler), S(s, "touchmove", o._delayedDragTouchMoveHandler), r.supportPointer && S(s, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(c, r.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    g && Re(g), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    x(t, "mouseup", this._disableDelayedDrag), x(t, "touchend", this._disableDelayedDrag), x(t, "touchcancel", this._disableDelayedDrag), x(t, "pointerup", this._disableDelayedDrag), x(t, "pointercancel", this._disableDelayedDrag), x(t, "mousemove", this._delayedDragTouchMoveHandler), x(t, "touchmove", this._delayedDragTouchMoveHandler), x(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? S(document, "pointermove", this._onTouchMove) : e ? S(document, "touchmove", this._onTouchMove) : S(document, "mousemove", this._onTouchMove) : (S(g, "dragend", this), S(k, "dragstart", this._onDragStart));
    try {
      document.selection ? ce(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if ($t = !1, k && g) {
      N("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && S(document, "dragover", an);
      var i = this.options;
      !t && z(g, i.dragClass, !1), z(g, i.ghostClass, !0), y.active = this, t && this._appendGhost(), P({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (q) {
      this._lastX = q.clientX, this._lastY = q.clientY, ro();
      for (var t = document.elementFromPoint(q.clientX, q.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(q.clientX, q.clientY), t !== e); )
        e = t;
      if (g.parentNode[B]._isOutsideThisEl(t), e)
        do {
          if (e[B]) {
            var i = void 0;
            if (i = e[B]._onDragOver({
              clientX: q.clientX,
              clientY: q.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = Ji(e));
      so();
    }
  },
  _onTouchMove: function(t) {
    if (ft) {
      var e = this.options, i = e.fallbackTolerance, o = e.fallbackOffset, n = t.touches ? t.touches[0] : t, r = w && Et(w, !0), s = w && r && r.a, c = w && r && r.d, l = ie && R && xi(R), u = (n.clientX - ft.clientX + o.x) / (s || 1) + (l ? l[0] - Ie[0] : 0) / (s || 1), d = (n.clientY - ft.clientY + o.y) / (c || 1) + (l ? l[1] - Ie[1] : 0) / (c || 1);
      if (!y.active && !$t) {
        if (i && Math.max(Math.abs(n.clientX - this._lastX), Math.abs(n.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (w) {
        r ? (r.e += u - (Oe || 0), r.f += d - (Me || 0)) : r = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: d
        };
        var h = "matrix(".concat(r.a, ",").concat(r.b, ",").concat(r.c, ",").concat(r.d, ",").concat(r.e, ",").concat(r.f, ")");
        b(w, "webkitTransform", h), b(w, "mozTransform", h), b(w, "msTransform", h), b(w, "transform", h), Oe = u, Me = d, q = n;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!w) {
      var t = this.options.fallbackOnBody ? document.body : k, e = L(g, !0, ie, !0, t), i = this.options;
      if (ie) {
        for (R = t; b(R, "position") === "static" && b(R, "transform") === "none" && R !== document; )
          R = R.parentNode;
        R !== document.body && R !== document.documentElement ? (R === document && (R = j()), e.top += R.scrollTop, e.left += R.scrollLeft) : R = j(), Ie = xi(R);
      }
      w = g.cloneNode(!0), z(w, i.ghostClass, !1), z(w, i.fallbackClass, !0), z(w, i.dragClass, !0), b(w, "transition", ""), b(w, "transform", ""), b(w, "box-sizing", "border-box"), b(w, "margin", 0), b(w, "top", e.top), b(w, "left", e.left), b(w, "width", e.width), b(w, "height", e.height), b(w, "opacity", "0.8"), b(w, "position", ie ? "absolute" : "fixed"), b(w, "zIndex", "100000"), b(w, "pointerEvents", "none"), y.ghost = w, t.appendChild(w), b(w, "transform-origin", Si / parseInt(w.style.width) * 100 + "% " + $i / parseInt(w.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, o = t.dataTransfer, n = i.options;
    if (N("dragStart", this, {
      evt: t
    }), y.eventCanceled) {
      this._onDrop();
      return;
    }
    N("setupClone", this), y.eventCanceled || (T = eo(g), T.removeAttribute("id"), T.draggable = !1, T.style["will-change"] = "", this._hideClone(), z(T, this.options.chosenClass, !1), y.clone = T), i.cloneId = ce(function() {
      N("clone", i), !y.eventCanceled && (i.options.removeCloneOnHide || k.insertBefore(T, g), i._hideClone(), P({
        sortable: i,
        name: "clone"
      }));
    }), !e && z(g, n.dragClass, !0), e ? (fe = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (x(document, "mouseup", i._onDrop), x(document, "touchend", i._onDrop), x(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", n.setData && n.setData.call(i, o, g)), S(document, "drop", i), b(g, "transform", "translateZ(0)")), $t = !0, i._dragStartId = ce(i._dragStarted.bind(i, e, t)), S(document, "selectstart", i), Nt = !0, window.getSelection().removeAllRanges(), Ht && b(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, o, n, r, s = this.options, c = s.group, l = y.active, u = te === c, d = s.sort, h = I || l, p, f = this, m = !1;
    if (ze) return;
    function v(It, mo) {
      N(It, f, Y({
        evt: t,
        isOwner: u,
        axis: p ? "vertical" : "horizontal",
        revert: r,
        dragRect: o,
        targetRect: n,
        canSort: d,
        fromSortable: h,
        target: i,
        completed: A,
        onMove: function(ai, _o) {
          return oe(k, e, g, o, ai, L(ai), t, _o);
        },
        changed: M
      }, mo));
    }
    function $() {
      v("dragOverAnimationCapture"), f.captureAnimationState(), f !== h && h.captureAnimationState();
    }
    function A(It) {
      return v("dragOverCompleted", {
        insertion: It
      }), It && (u ? l._hideClone() : l._showClone(f), f !== h && (z(g, I ? I.options.ghostClass : l.options.ghostClass, !1), z(g, s.ghostClass, !0)), I !== f && f !== y.active ? I = f : f === y.active && I && (I = null), h === f && (f._ignoreWhileAnimating = i), f.animateAll(function() {
        v("dragOverAnimationComplete"), f._ignoreWhileAnimating = null;
      }), f !== h && (h.animateAll(), h._ignoreWhileAnimating = null)), (i === g && !g.animated || i === e && !i.animated) && (xt = null), !s.dragoverBubble && !t.rootEl && i !== document && (g.parentNode[B]._isOutsideThisEl(t.target), !It && gt(t)), !s.dragoverBubble && t.stopPropagation && t.stopPropagation(), m = !0;
    }
    function M() {
      U = H(g), et = H(g, s.draggable), P({
        sortable: f,
        name: "change",
        toEl: e,
        newIndex: U,
        newDraggableIndex: et,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = W(i, s.draggable, e, !0), v("dragOver"), y.eventCanceled) return m;
    if (g.contains(t.target) || i.animated && i.animatingX && i.animatingY || f._ignoreWhileAnimating === i)
      return A(!1);
    if (fe = !1, l && !s.disabled && (u ? d || (r = D !== k) : I === this || (this.lastPutMode = te.checkPull(this, l, g, t)) && c.checkPut(this, l, g, t))) {
      if (p = this._getDirection(t, i) === "vertical", o = L(g), v("dragOverValid"), y.eventCanceled) return m;
      if (r)
        return D = k, $(), this._hideClone(), v("revert"), y.eventCanceled || (_t ? k.insertBefore(g, _t) : k.appendChild(g)), A(!0);
      var E = ti(e, s.draggable);
      if (!E || ln(t, p, this) && !E.animated) {
        if (E === g)
          return A(!1);
        if (E && e === t.target && (i = E), i && (n = L(i)), oe(k, e, g, o, i, n, t, !!i) !== !1)
          return $(), E && E.nextSibling ? e.insertBefore(g, E.nextSibling) : e.appendChild(g), D = e, M(), A(!0);
      } else if (E && cn(t, p, this)) {
        var lt = Tt(e, 0, s, !0);
        if (lt === g)
          return A(!1);
        if (i = lt, n = L(i), oe(k, e, g, o, i, n, t, !1) !== !1)
          return $(), e.insertBefore(g, lt), D = e, M(), A(!0);
      } else if (i.parentNode === e) {
        n = L(i);
        var V = 0, dt, Ct = g.parentNode !== e, F = !on(g.animated && g.toRect || o, i.animated && i.toRect || n, p), Lt = p ? "top" : "left", Z = wi(i, "top", "top") || wi(g, "top", "top"), Ot = Z ? Z.scrollTop : void 0;
        xt !== i && (dt = n[Lt], Vt = !1, ee = !F && s.invertSwap || Ct), V = dn(t, i, n, p, F ? 1 : s.swapThreshold, s.invertedSwapThreshold == null ? s.swapThreshold : s.invertedSwapThreshold, ee, xt === i);
        var X;
        if (V !== 0) {
          var ut = H(g);
          do
            ut -= V, X = D.children[ut];
          while (X && (b(X, "display") === "none" || X === w));
        }
        if (V === 0 || X === i)
          return A(!1);
        xt = i, Kt = V;
        var Mt = i.nextElementSibling, tt = !1;
        tt = V === 1;
        var Zt = oe(k, e, g, o, i, n, t, tt);
        if (Zt !== !1)
          return (Zt === 1 || Zt === -1) && (tt = Zt === 1), ze = !0, setTimeout(sn, 30), $(), tt && !Mt ? e.appendChild(g) : i.parentNode.insertBefore(g, tt ? Mt : i), Z && to(Z, 0, Ot - Z.scrollTop), D = g.parentNode, dt !== void 0 && !ee && (se = Math.abs(dt - L(i)[Lt])), M(), A(!0);
      }
      if (e.contains(g))
        return A(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    x(document, "mousemove", this._onTouchMove), x(document, "touchmove", this._onTouchMove), x(document, "pointermove", this._onTouchMove), x(document, "dragover", gt), x(document, "mousemove", gt), x(document, "touchmove", gt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    x(t, "mouseup", this._onDrop), x(t, "touchend", this._onDrop), x(t, "pointerup", this._onDrop), x(t, "pointercancel", this._onDrop), x(t, "touchcancel", this._onDrop), x(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (U = H(g), et = H(g, i.draggable), N("drop", this, {
      evt: t
    }), D = g && g.parentNode, U = H(g), et = H(g, i.draggable), y.eventCanceled) {
      this._nulling();
      return;
    }
    $t = !1, ee = !1, Vt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), Ue(this.cloneId), Ue(this._dragStartId), this.nativeDraggable && (x(document, "drop", this), x(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Ht && b(document.body, "user-select", ""), b(g, "transform", ""), t && (Nt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), w && w.parentNode && w.parentNode.removeChild(w), (k === D || I && I.lastPutMode !== "clone") && T && T.parentNode && T.parentNode.removeChild(T), g && (this.nativeDraggable && x(g, "dragend", this), Re(g), g.style["will-change"] = "", Nt && !$t && z(g, I ? I.options.ghostClass : this.options.ghostClass, !1), z(g, this.options.chosenClass, !1), P({
      sortable: this,
      name: "unchoose",
      toEl: D,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), k !== D ? (U >= 0 && (P({
      rootEl: D,
      name: "add",
      toEl: D,
      fromEl: k,
      originalEvent: t
    }), P({
      sortable: this,
      name: "remove",
      toEl: D,
      originalEvent: t
    }), P({
      rootEl: D,
      name: "sort",
      toEl: D,
      fromEl: k,
      originalEvent: t
    }), P({
      sortable: this,
      name: "sort",
      toEl: D,
      originalEvent: t
    })), I && I.save()) : U !== At && U >= 0 && (P({
      sortable: this,
      name: "update",
      toEl: D,
      originalEvent: t
    }), P({
      sortable: this,
      name: "sort",
      toEl: D,
      originalEvent: t
    })), y.active && ((U == null || U === -1) && (U = At, et = Wt), P({
      sortable: this,
      name: "end",
      toEl: D,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    N("nulling", this), k = g = D = w = _t = T = re = ot = ft = q = Nt = U = et = At = Wt = xt = Kt = I = te = y.dragged = y.ghost = y.clone = y.active = null, me.forEach(function(t) {
      t.checked = !0;
    }), me.length = Oe = Me = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        g && (this._onDragOver(t), rn(t));
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
    for (var t = [], e, i = this.el.children, o = 0, n = i.length, r = this.options; o < n; o++)
      e = i[o], W(e, r.draggable, this.el, !1) && t.push(e.getAttribute(r.dataIdAttr) || hn(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(n, r) {
      var s = o.children[r];
      W(s, this.options.draggable, o, !1) && (i[n] = s);
    }, this), e && this.captureAnimationState(), t.forEach(function(n) {
      i[n] && (o.removeChild(i[n]), o.appendChild(i[n]));
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
    return W(t, e || this.options.draggable, this.el, !1);
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
    var o = Qt.modifyOption(this, t, e);
    typeof o < "u" ? i[t] = o : i[t] = e, t === "group" && ao(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    N("destroy", this);
    var t = this.el;
    t[B] = null, x(t, "mousedown", this._onTapStart), x(t, "touchstart", this._onTapStart), x(t, "pointerdown", this._onTapStart), this.nativeDraggable && (x(t, "dragover", this), x(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), ge.splice(ge.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!ot) {
      if (N("hideClone", this), y.eventCanceled) return;
      b(T, "display", "none"), this.options.removeCloneOnHide && T.parentNode && T.parentNode.removeChild(T), ot = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (ot) {
      if (N("showClone", this), y.eventCanceled) return;
      g.parentNode == k && !this.options.group.revertClone ? k.insertBefore(T, g) : _t ? k.insertBefore(T, _t) : k.appendChild(T), this.options.group.revertClone && this.animate(g, T), b(T, "display", ""), ot = !1;
    }
  }
};
function rn(a) {
  a.dataTransfer && (a.dataTransfer.dropEffect = "move"), a.cancelable && a.preventDefault();
}
function oe(a, t, e, i, o, n, r, s) {
  var c, l = a[B], u = l.options.onMove, d;
  return window.CustomEvent && !Q && !Jt ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = a, c.dragged = e, c.draggedRect = i, c.related = o || t, c.relatedRect = n || L(t), c.willInsertAfter = s, c.originalEvent = r, a.dispatchEvent(c), u && (d = u.call(l, c, r)), d;
}
function Re(a) {
  a.draggable = !1;
}
function sn() {
  ze = !1;
}
function cn(a, t, e) {
  var i = L(Tt(e.el, 0, e.options, !0)), o = io(e.el, e.options, w), n = 10;
  return t ? a.clientX < o.left - n || a.clientY < i.top && a.clientX < i.right : a.clientY < o.top - n || a.clientY < i.bottom && a.clientX < i.left;
}
function ln(a, t, e) {
  var i = L(ti(e.el, e.options.draggable)), o = io(e.el, e.options, w), n = 10;
  return t ? a.clientX > o.right + n || a.clientY > i.bottom && a.clientX > i.left : a.clientY > o.bottom + n || a.clientX > i.right && a.clientY > i.top;
}
function dn(a, t, e, i, o, n, r, s) {
  var c = i ? a.clientY : a.clientX, l = i ? e.height : e.width, u = i ? e.top : e.left, d = i ? e.bottom : e.right, h = !1;
  if (!r) {
    if (s && se < l * o) {
      if (!Vt && (Kt === 1 ? c > u + l * n / 2 : c < d - l * n / 2) && (Vt = !0), Vt)
        h = !0;
      else if (Kt === 1 ? c < u + se : c > d - se)
        return -Kt;
    } else if (c > u + l * (1 - o) / 2 && c < d - l * (1 - o) / 2)
      return un(t);
  }
  return h = h || r, h && (c < u + l * n / 2 || c > d - l * n / 2) ? c > u + l / 2 ? 1 : -1 : 0;
}
function un(a) {
  return H(g) < H(a) ? 1 : -1;
}
function hn(a) {
  for (var t = a.tagName + a.className + a.src + a.href + a.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function pn(a) {
  me.length = 0;
  for (var t = a.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && me.push(i);
  }
}
function ce(a) {
  return setTimeout(a, 0);
}
function Ue(a) {
  return clearTimeout(a);
}
$e && S(document, "touchmove", function(a) {
  (y.active || $t) && a.cancelable && a.preventDefault();
});
y.utils = {
  on: S,
  off: x,
  css: b,
  find: Qi,
  is: function(t, e) {
    return !!W(t, e, t, !1);
  },
  extend: Yo,
  throttle: Zi,
  closest: W,
  toggleClass: z,
  clone: eo,
  index: H,
  nextTick: ce,
  cancelNextTick: Ue,
  detectDirection: no,
  getChild: Tt,
  expando: B
};
y.get = function(a) {
  return a[B];
};
y.mount = function() {
  for (var a = arguments.length, t = new Array(a), e = 0; e < a; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (y.utils = Y(Y({}, y.utils), i.utils)), Qt.mount(i);
  });
};
y.create = function(a, t) {
  return new y(a, t);
};
y.version = Vo;
var C = [], Bt, He, qe = !1, Pe, Ne, _e, Ft;
function fn() {
  function a() {
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
  return a.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? S(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? S(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? S(document, "touchmove", this._handleFallbackAutoScroll) : S(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? x(document, "dragover", this._handleAutoScroll) : (x(document, "pointermove", this._handleFallbackAutoScroll), x(document, "touchmove", this._handleFallbackAutoScroll), x(document, "mousemove", this._handleFallbackAutoScroll)), Ei(), le(), Xo();
    },
    nulling: function() {
      _e = He = Bt = qe = Ft = Pe = Ne = null, C.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var o = this, n = (e.touches ? e.touches[0] : e).clientX, r = (e.touches ? e.touches[0] : e).clientY, s = document.elementFromPoint(n, r);
      if (_e = e, i || this.options.forceAutoScrollFallback || Jt || Q || Ht) {
        Be(e, this.options, s, i);
        var c = at(s, !0);
        qe && (!Ft || n !== Pe || r !== Ne) && (Ft && Ei(), Ft = setInterval(function() {
          var l = at(document.elementFromPoint(n, r), !0);
          l !== c && (c = l, le()), Be(e, o.options, l, i);
        }, 10), Pe = n, Ne = r);
      } else {
        if (!this.options.bubbleScroll || at(s, !0) === j()) {
          le();
          return;
        }
        Be(e, this.options, at(s, !1), !1);
      }
    }
  }, J(a, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function le() {
  C.forEach(function(a) {
    clearInterval(a.pid);
  }), C = [];
}
function Ei() {
  clearInterval(Ft);
}
var Be = Zi(function(a, t, e, i) {
  if (t.scroll) {
    var o = (a.touches ? a.touches[0] : a).clientX, n = (a.touches ? a.touches[0] : a).clientY, r = t.scrollSensitivity, s = t.scrollSpeed, c = j(), l = !1, u;
    He !== e && (He = e, le(), Bt = t.scroll, u = t.scrollFn, Bt === !0 && (Bt = at(e, !0)));
    var d = 0, h = Bt;
    do {
      var p = h, f = L(p), m = f.top, v = f.bottom, $ = f.left, A = f.right, M = f.width, E = f.height, lt = void 0, V = void 0, dt = p.scrollWidth, Ct = p.scrollHeight, F = b(p), Lt = p.scrollLeft, Z = p.scrollTop;
      p === c ? (lt = M < dt && (F.overflowX === "auto" || F.overflowX === "scroll" || F.overflowX === "visible"), V = E < Ct && (F.overflowY === "auto" || F.overflowY === "scroll" || F.overflowY === "visible")) : (lt = M < dt && (F.overflowX === "auto" || F.overflowX === "scroll"), V = E < Ct && (F.overflowY === "auto" || F.overflowY === "scroll"));
      var Ot = lt && (Math.abs(A - o) <= r && Lt + M < dt) - (Math.abs($ - o) <= r && !!Lt), X = V && (Math.abs(v - n) <= r && Z + E < Ct) - (Math.abs(m - n) <= r && !!Z);
      if (!C[d])
        for (var ut = 0; ut <= d; ut++)
          C[ut] || (C[ut] = {});
      (C[d].vx != Ot || C[d].vy != X || C[d].el !== p) && (C[d].el = p, C[d].vx = Ot, C[d].vy = X, clearInterval(C[d].pid), (Ot != 0 || X != 0) && (l = !0, C[d].pid = setInterval((function() {
        i && this.layer === 0 && y.active._onTouchMove(_e);
        var Mt = C[this.layer].vy ? C[this.layer].vy * s : 0, tt = C[this.layer].vx ? C[this.layer].vx * s : 0;
        typeof u == "function" && u.call(y.dragged.parentNode[B], tt, Mt, a, _e, C[this.layer].el) !== "continue" || to(C[this.layer].el, tt, Mt);
      }).bind({
        layer: d
      }), 24))), d++;
    } while (t.bubbleScroll && h !== c && (h = at(h, !1)));
    qe = l;
  }
}, 30), co = function(t) {
  var e = t.originalEvent, i = t.putSortable, o = t.dragEl, n = t.activeSortable, r = t.dispatchSortableEvent, s = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var l = i || n;
    s();
    var u = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, d = document.elementFromPoint(u.clientX, u.clientY);
    c(), l && !l.el.contains(d) && (r("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function ei() {
}
ei.prototype = {
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
J(ei, {
  pluginName: "revertOnSpill"
});
function ii() {
}
ii.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, o = i || this.sortable;
    o.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), o.animateAll();
  },
  drop: co
};
J(ii, {
  pluginName: "removeOnSpill"
});
y.mount(new fn());
y.mount(ii, ei);
const gn = {
  room: "area"
}, lo = /* @__PURE__ */ new Set(["building", "grounds"]);
function mn(a) {
  const t = String(a ?? "area").trim().toLowerCase(), e = gn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function ct(a) {
  var t, e;
  return mn((e = (t = a.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function We(a) {
  return a === "floor" ? ["root", "building"] : lo.has(a) ? ["root"] : a === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function _n(a, t) {
  return We(a).includes(t);
}
function vn(a) {
  var l;
  const { locations: t, locationId: e, newParentId: i } = a;
  if (i === e || i && de(t, e, i)) return !1;
  const o = new Map(t.map((u) => [u.id, u])), n = o.get(e);
  if (!n || i && !o.get(i) || i && ((l = o.get(i)) != null && l.is_explicit_root) || t.some((u) => u.parent_id === n.id) && i !== n.parent_id) return !1;
  const s = ct(n);
  if (lo.has(s))
    return i === null;
  const c = i === null ? "root" : ct(o.get(i) ?? {});
  return !!_n(s, c);
}
function de(a, t, e) {
  if (t === e) return !1;
  const i = new Map(a.map((r) => [r.id, r]));
  let o = i.get(e);
  const n = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === t || n.has(o.parent_id)) return !0;
    n.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
function bn(a) {
  const t = a.toLowerCase(), e = {
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
  for (const [o, n] of Object.entries(e))
    if (n.some((r) => t.includes(r)))
      return i[o] ?? null;
  return null;
}
function uo(a) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[a] ?? "mdi:map-marker";
}
function yn(a) {
  const t = String(a ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function wn(a) {
  var o;
  const t = (o = a.modules) == null ? void 0 : o._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = bn(a.name);
  if (e) return e;
  const i = yn(t == null ? void 0 : t.type);
  return uo(i);
}
function ki(a, t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of a) {
    const r = n.parent_id;
    e.has(r) || e.set(r, []), e.get(r).push(n);
  }
  const i = [];
  function o(n, r) {
    const s = e.get(n) || [];
    for (const c of s) {
      const u = (e.get(c.id) || []).length > 0, d = t.has(c.id);
      i.push({ location: c, depth: r, hasChildren: u, isExpanded: d }), d && u && o(c.id, r + 1);
    }
  }
  return o(null, 0), i;
}
function xn(a, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of a) {
      const n = o.location.parent_id;
      n && e.has(n) && !e.has(o.location.id) && (e.add(o.location.id), i = !0);
    }
  }
  return e;
}
function Sn(a, t, e, i, o, n) {
  const s = xn(a, t), c = a.filter((v) => !s.has(v.location.id));
  let l = o;
  const u = a.find((v) => v.location.id === t), d = u ? ct(u.location) : "area", h = n != null && n.relatedId ? c.find((v) => v.location.id === n.relatedId) : void 0;
  if (h) {
    const v = ct(h.location);
    h.location.id === o ? l = h.location.parent_id : v === "floor" ? d === "floor" || (n == null ? void 0 : n.pointerX) !== void 0 && (n == null ? void 0 : n.relatedLeft) !== void 0 && n.pointerX < n.relatedLeft + 10 ? l = h.location.parent_id : l = h.location.id : (n == null ? void 0 : n.pointerX) !== void 0 && (n == null ? void 0 : n.relatedLeft) !== void 0 && n.pointerX < n.relatedLeft + 10 ? l = h.location.parent_id : (n == null ? void 0 : n.pointerX) !== void 0 && (n == null ? void 0 : n.relatedLeft) !== void 0 && n.pointerX >= n.relatedLeft + 10 || h.isExpanded && (n != null && n.willInsertAfter) ? l = d === "floor" && v !== "building" ? h.location.parent_id : h.location.id : l = h.location.parent_id;
  }
  const p = c.filter((v) => v.location.parent_id === l);
  if (h) {
    if (l === h.location.id)
      return { parentId: l, siblingIndex: p.length };
    const v = p.findIndex(
      ($) => $.location.id === h.location.id
    );
    if (v >= 0) {
      const $ = n != null && n.willInsertAfter ? v + 1 : v;
      return { parentId: l, siblingIndex: Math.max(0, Math.min($, p.length)) };
    }
  }
  const f = Math.max(
    0,
    Math.min(
      i > e ? i - s.size : i,
      c.length
    )
  ), m = c.slice(0, f).filter((v) => v.location.parent_id === l).length;
  return { parentId: l, siblingIndex: m };
}
const ve = class ve extends st {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveDropContextFromPointer(t, e, i) {
    var r;
    if (i === void 0) return;
    const o = Array.from(
      ((r = this.shadowRoot) == null ? void 0 : r.querySelectorAll(".tree-item[data-id]")) || []
    );
    let n;
    for (const s of o) {
      const c = s.getAttribute("data-id") || void 0;
      if (!c || c === t || de(this.locations, t, c)) continue;
      const l = s.getBoundingClientRect(), u = l.top + l.height / 2, d = Math.abs(i - u);
      (!n || d < n.dist) && (n = { id: c, left: l.left, centerY: u, dist: d });
    }
    if (n)
      return {
        relatedId: n.id,
        relatedLeft: n.left,
        pointerX: e,
        willInsertAfter: i >= n.centerY
      };
  }
  _resolveRelatedId(t) {
    var r, s, c;
    const e = ((r = t.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const o = (s = t.originalEvent) == null ? void 0 : s.clientY;
    if (o !== void 0) {
      const l = Array.from(
        ((c = this.shadowRoot) == null ? void 0 : c.querySelectorAll(".tree-item[data-id]")) || []
      );
      let u, d = Number.POSITIVE_INFINITY;
      for (const h of l) {
        const p = h.getAttribute("data-id") || void 0;
        if (!p || p === e || de(this.locations, e, p))
          continue;
        const f = h.getBoundingClientRect(), m = f.top + f.height / 2, v = Math.abs(o - m);
        v < d && (d = v, u = p);
      }
      if (u) return u;
    }
    let n = i;
    for (; n; ) {
      if (n.classList.contains("tree-item")) {
        const l = n.getAttribute("data-id") || void 0;
        if (l && l !== e && !de(this.locations, e, l))
          return l;
      }
      n = t.willInsertAfter ? n.nextElementSibling : n.previousElementSibling;
    }
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
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
      this._expandedIds = new Set(t), this._hasInitializedExpansion = !0;
    else
      for (const e of t)
        if (!this._expandedIds.has(e)) {
          const i = new Set(this._expandedIds);
          i.add(e), this._expandedIds = i;
        }
  }
  _initializeSortable() {
    var t;
    (t = this._sortable) == null || t.destroy(), this.updateComplete.then(() => {
      var i;
      const e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      e && (this._sortable = y.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: () => {
          this._isDragging = !0;
        },
        onMove: (o) => {
          var s, c;
          const n = o.related;
          if (n != null && n.classList.contains("tree-item")) {
            const l = this._resolveRelatedId(o), d = ((l ? (s = this.shadowRoot) == null ? void 0 : s.querySelector(
              `.tree-item[data-id="${l}"]`
            ) : null) || n).getBoundingClientRect();
            this._lastDropContext = {
              relatedId: l ?? n.getAttribute("data-id") ?? void 0,
              willInsertAfter: o.willInsertAfter,
              pointerX: (c = o.originalEvent) == null ? void 0 : c.clientX,
              relatedLeft: d.left
            };
          }
          const r = n;
          if (r && r.classList.contains("tree-item")) {
            const l = r.getAttribute("data-id");
            l && !this._expandedIds.has(l) && (this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._autoExpandTimer = window.setTimeout(() => {
              const u = new Set(this._expandedIds);
              u.add(l), this._expandedIds = u;
            }, 800));
          }
          return !0;
        },
        onEnd: (o) => {
          this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._isDragging = !1, this._handleDragEnd(o), this._lastDropContext = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    var v, $;
    const { item: e, newIndex: i, oldIndex: o } = t;
    if (i === void 0 || o === void 0) return;
    const n = e.getAttribute("data-id");
    if (!n) return;
    const r = this.locations.find((A) => A.id === n);
    if (!r) return;
    const s = (v = t.originalEvent) == null ? void 0 : v.clientX, c = ($ = t.originalEvent) == null ? void 0 : $.clientY, u = this._resolveDropContextFromPointer(n, s, c) || this._lastDropContext, d = ki(this.locations, this._expandedIds), h = Sn(
      d,
      n,
      o,
      i,
      r.parent_id,
      u
    ), p = h.parentId, f = h.siblingIndex, m = d.slice(0, o).filter((A) => A.location.parent_id === r.parent_id).length;
    if (p === r.parent_id && f === m) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!vn({ locations: this.locations, locationId: n, newParentId: p })) {
      this.locations.some((M) => M.parent_id === n) && p !== r.parent_id && this.dispatchEvent(
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
      detail: { locationId: n, newParentId: p, newIndex: f },
      bubbles: !0,
      composed: !0
    }));
  }
  _restoreTreeAfterCancelledDrop() {
    this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const n of e) {
      const r = n.getAttribute("data-id");
      if (r) {
        if (i.has(r)) {
          n.remove();
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
    const t = ki(this.locations, this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return _`
      <div class="tree-list">
        ${Ho(
      t,
      (o) => `${this.version}:${o.location.id}:${o.depth}`,
      (o) => this._renderItem(
        o,
        e[o.location.id] || "unknown",
        i[o.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
      </div>
    `;
  }
  _renderItem(t, e, i) {
    var M;
    const { location: o, depth: n, hasChildren: r, isExpanded: s } = t, c = this.selectedId === o.id, l = this._editingId === o.id, u = n * 24, d = ct(o), h = o.is_explicit_root ? "root" : d, p = o.is_explicit_root ? "home root" : d, f = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", m = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", v = ((M = this.occupancyStates) == null ? void 0 : M[o.id]) === !0, $ = "mdi:home-switch-outline", A = v ? "Set vacant" : "Set occupied";
    return _`
      <div
        class="tree-item ${c ? "selected" : ""} ${d === "floor" ? "floor-item" : ""}"
        data-id=${o.id}
        style="margin-left: ${u}px"
        @click=${(E) => this._handleClick(E, o)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder or move levels." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${s ? "expanded" : ""} ${r ? "" : "hidden"}"
          @click=${(E) => this._handleExpand(E, o.id)}
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

        ${l ? _`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(E) => this._editingValue = E.target.value}
                  @blur=${() => this._finishEditing(o.id)}
                  @keydown=${(E) => this._handleEditKeydown(E, o.id)}
                  @click=${(E) => E.stopPropagation()} />` : _`<div
              class="location-name"
              @dblclick=${this.allowRename ? (E) => this._startEditing(E, o) : () => {
    }}
            >${o.name}</div>`}

        <span class="type-badge ${h}">${p}</span>

        ${o.is_explicit_root || this.readOnly ? "" : _`
              <button
                class="occupancy-btn"
                title=${A}
                @click=${(E) => this._handleOccupancyToggle(E, o, v)}
              >
                <ha-icon .icon=${$}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${m}
                @click=${(E) => this._handleLockToggle(E, o, i)}
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
    const o = /* @__PURE__ */ new Map(), n = (r) => {
      var p;
      const s = o.get(r);
      if (s) return s;
      if (!e.has(r)) return "unknown";
      const c = (p = this.occupancyStates) == null ? void 0 : p[r], l = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", u = i.get(r) || [];
      if (!u.length)
        return o.set(r, l), l;
      const d = u.map((f) => n(f));
      let h;
      return l === "occupied" || d.includes("occupied") ? h = "occupied" : l === "vacant" || d.length > 0 && d.every((f) => f === "vacant") ? h = "vacant" : h = "unknown", o.set(r, h), h;
    };
    for (const r of this.locations)
      t[r.id] = n(r.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const o of Object.values(t)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if (n.device_class !== "occupancy") continue;
      const r = n.location_id;
      if (!r) continue;
      const s = n.locked_by;
      e[String(r)] = {
        isLocked: !!n.is_locked,
        lockedBy: Array.isArray(s) ? s.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _getIcon(t) {
    var i, o, n;
    if (t.ha_area_id && ((n = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[t.ha_area_id]) != null && n.icon))
      return this.hass.areas[t.ha_area_id].icon;
    const e = ct(t);
    return uo(e);
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
ve.properties = {
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
  _isDragging: { state: !0 }
}, ve.styles = [
  Se,
  Gt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        padding: var(--spacing-md);
        min-height: 100px;
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
let Ke = ve;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Ke);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $n = Vi(class extends ji {
  constructor(a) {
    if (super(a), a.type !== mt.PROPERTY && a.type !== mt.ATTRIBUTE && a.type !== mt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!Fo(a)) throw Error("`live` bindings can only contain a single expression");
  }
  render(a) {
    return a;
  }
  update(a, [t]) {
    if (t === K || t === O) return t;
    const e = a.element, i = a.name;
    if (a.type === mt.PROPERTY) {
      if (t === e[i]) return K;
    } else if (a.type === mt.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return K;
    } else if (a.type === mt.ATTRIBUTE && e.getAttribute(i) === t + "") return K;
    return Yi(a), t;
  }
}), nt = 30 * 60, Ti = 5 * 60;
function ho(a) {
  if (!a) return "";
  const t = a.indexOf(".");
  return t >= 0 ? a.slice(0, t) : "";
}
function An(a) {
  return ["door", "garage_door", "opening", "window"].includes(a || "");
}
function En(a) {
  return ["presence", "occupancy"].includes(a || "");
}
function kn(a) {
  return a === "motion";
}
function po(a) {
  return a === "media_player";
}
function fo(a) {
  var i;
  const t = ho(a == null ? void 0 : a.entity_id), e = (i = a == null ? void 0 : a.attributes) == null ? void 0 : i.device_class;
  if (po(t))
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: nt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: nt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Ti
    };
  if (t === "binary_sensor") {
    if (En(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Ti
      };
    if (kn(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: nt,
        off_event: "none",
        off_trailing: 0
      };
    if (An(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: nt,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (a == null ? void 0 : a.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: nt,
    off_event: "none",
    off_trailing: 0
  };
}
function Tn(a, t, e) {
  const i = ho(e == null ? void 0 : e.entity_id), o = fo(e);
  if (po(i)) {
    const r = a.on_timeout && a.on_timeout > 0 ? a.on_timeout : nt;
    return {
      ...a,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const r = a.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : nt);
    return {
      ...a,
      mode: t,
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  const n = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: nt,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...a,
    mode: t,
    on_event: a.on_event ?? n.on_event,
    on_timeout: a.on_timeout ?? n.on_timeout,
    off_event: a.off_event ?? n.off_event,
    off_trailing: a.off_trailing ?? n.off_trailing
  };
}
const oi = "topomation_", ue = "[topomation]", Dn = "Topomation", Cn = "Topomation - On Occupied", Ln = "Topomation - On Vacant", Di = "Topomation";
function On(a) {
  return a.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "location";
}
function Ci(a) {
  return `config/automation/config/${encodeURIComponent(a)}`;
}
async function Ve(a, t, e, i) {
  if (typeof a.callApi == "function")
    return a.callApi(t, Ci(e), i);
  const o = await fetch(`/api/${Ci(e)}`, {
    method: t.toUpperCase(),
    credentials: "same-origin",
    headers: i !== void 0 ? {
      "Content-Type": "application/json"
    } : void 0,
    body: i !== void 0 ? JSON.stringify(i) : void 0
  }), n = await o.json().catch(() => ({}));
  if (!o.ok)
    throw new Error(
      n && typeof n.message == "string" && n.message || `Home Assistant automation API error (${o.status})`
    );
  return n;
}
function Mn(a) {
  if (typeof a != "string" || !a.includes(ue))
    return null;
  const t = a.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(ue)) continue;
    const i = e.slice(ue.length).trim();
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
function In(a) {
  return `${ue} ${JSON.stringify(a)}`;
}
function Rn(a) {
  var s, c;
  const t = (a == null ? void 0 : a.actions) ?? (a == null ? void 0 : a.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", o = i.includes(".") ? i.split(".").slice(1).join(".") : i, n = (s = e == null ? void 0 : e.target) == null ? void 0 : s.entity_id;
  if (typeof n == "string")
    return {
      action_entity_id: n,
      action_service: o || void 0
    };
  if (Array.isArray(n) && typeof n[0] == "string")
    return {
      action_entity_id: n[0],
      action_service: o || void 0
    };
  const r = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
  return typeof r == "string" ? {
    action_entity_id: r,
    action_service: o || void 0
  } : {
    action_service: o || void 0
  };
}
function Pn(a) {
  const t = (a == null ? void 0 : a.conditions) ?? (a == null ? void 0 : a.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
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
function Nn(a, t) {
  const e = a.states || {};
  for (const [i, o] of Object.entries(e)) {
    if (!i.startsWith("binary_sensor.")) continue;
    const n = (o == null ? void 0 : o.attributes) || {};
    if (n.device_class === "occupancy" && n.location_id === t)
      return i;
  }
}
async function go(a) {
  try {
    const t = await a.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation") : [];
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), Object.keys(a.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e }));
  }
}
async function Bn(a, t, e = 20, i = 250) {
  for (let o = 0; o < e; o += 1) {
    const n = await go(a), r = n.find((s) => s.unique_id === t);
    if (r)
      return r;
    if (o === e - 1) {
      const s = await Hn(a, n, t);
      if (s)
        return s;
    }
    await new Promise((s) => window.setTimeout(s, i));
  }
}
function ni(a, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof a.unique_id == "string" ? a.unique_id.trim() : "";
  if (i) return i;
}
function Fn(a) {
  return !!((typeof a.unique_id == "string" ? a.unique_id.trim().toLowerCase() : "").startsWith(oi) || (Array.isArray(a.labels) ? a.labels : []).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ) || Object.values(a.categories || {}).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ));
}
function zn(a) {
  return Object.entries(a.states || {}).some(([t, e]) => {
    var o;
    if (!t.startsWith("automation.")) return !1;
    const i = (o = e == null ? void 0 : e.attributes) == null ? void 0 : o.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(oi);
  });
}
function Un(a) {
  if (typeof a == "string" && a.trim()) return a.trim();
  if (a instanceof Error && a.message.trim()) return a.message.trim();
  if (a && typeof a == "object" && "message" in a) {
    const t = a.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function Hn(a, t, e) {
  const i = String(e || "").trim();
  return i ? (await Promise.all(
    t.filter((n) => typeof n.entity_id == "string" && n.entity_id.length > 0).map(async (n) => {
      try {
        const r = await a.callWS({
          type: "automation/config",
          entity_id: n.entity_id
        }), s = r == null ? void 0 : r.config;
        return !s || typeof s != "object" || ni(n, s) !== i ? void 0 : n;
      } catch {
        return;
      }
    })
  )).find((n) => !!n) : void 0;
}
async function Li(a, t) {
  const e = await a.callWS({ type: "config/label_registry/list" }), i = Array.isArray(e) ? e.find((o) => (o == null ? void 0 : o.name) === t && typeof (o == null ? void 0 : o.label_id) == "string") : void 0;
  if (i)
    return i.label_id;
  try {
    const o = await a.callWS({
      type: "config/label_registry/create",
      name: t
    });
    if (typeof (o == null ? void 0 : o.label_id) == "string")
      return o.label_id;
  } catch (o) {
    console.debug("[ha-automation-rules] failed to create label", t, o);
  }
}
async function qn(a) {
  const t = await a.callWS({
    type: "config/category_registry/list",
    scope: "automation"
  }), e = Array.isArray(t) ? t.find(
    (i) => (i == null ? void 0 : i.name) === Di && typeof (i == null ? void 0 : i.category_id) == "string"
  ) : void 0;
  if (e)
    return e.category_id;
  try {
    const i = await a.callWS({
      type: "config/category_registry/create",
      scope: "automation",
      name: Di,
      icon: "mdi:home-automation"
    });
    if (typeof (i == null ? void 0 : i.category_id) == "string")
      return i.category_id;
  } catch (i) {
    console.debug("[ha-automation-rules] failed to create automation category", i);
  }
}
async function Wn(a, t, e) {
  if (!t.entity_id) return;
  const i = await Li(a, Dn), n = await Li(a, e === "occupied" ? Cn : Ln), r = await qn(a), s = new Set(Array.isArray(t.labels) ? t.labels : []);
  i && s.add(i), n && s.add(n);
  const c = {
    ...t.categories || {}
  };
  r && (c.automation = r);
  try {
    await a.callWS({
      type: "config/entity_registry/update",
      entity_id: t.entity_id,
      labels: Array.from(s),
      categories: c
    });
  } catch (l) {
    console.debug("[ha-automation-rules] failed to assign labels/category", l);
  }
}
function Kn(a, t) {
  const e = Date.now(), i = Math.floor(Math.random() * 1e6).toString(36).padStart(4, "0");
  return `${oi}${On(a.id)}_${t}_${e}_${i}`;
}
async function Vn(a, t) {
  const e = await go(a), i = e.filter(Fn), o = i.length > 0 ? i : e, n = [], s = (await Promise.all(
    o.map(async (c) => {
      var l, u;
      if (c.entity_id)
        try {
          const d = await a.callWS({
            type: "automation/config",
            entity_id: c.entity_id
          }), h = d == null ? void 0 : d.config;
          if (!h || typeof h != "object")
            return;
          const p = Mn(h.description);
          if (!p || p.location_id !== t)
            return;
          const f = ni(c, h), m = Rn(h), v = (l = a.states) == null ? void 0 : l[c.entity_id], $ = v ? v.state !== "off" : !0, A = typeof h.alias == "string" && h.alias.trim() || ((u = v == null ? void 0 : v.attributes) == null ? void 0 : u.friendly_name) || c.entity_id;
          return {
            id: f || c.entity_id,
            entity_id: c.entity_id,
            name: A,
            trigger_type: p.trigger_type,
            action_entity_id: m.action_entity_id,
            action_service: m.action_service,
            require_dark: typeof p.require_dark == "boolean" ? p.require_dark : Pn(h),
            enabled: $
          };
        } catch (d) {
          n.push({
            entity_id: c.entity_id,
            error: d
          }), console.debug("[ha-automation-rules] failed to read automation config", c.entity_id, d);
          return;
        }
    })
  )).filter((c) => !!c).sort((c, l) => c.name.localeCompare(l.name));
  if (s.length === 0 && o.length > 0 && n.length === o.length && (i.length > 0 || zn(a))) {
    const c = n[0], l = c ? Un(c.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${l}`);
  }
  return s;
}
async function jn(a, t) {
  const e = Nn(a, t.location.id);
  if (!e)
    throw new Error(
      `No occupancy binary sensor found for location "${t.location.name}" (${t.location.id})`
    );
  const i = Kn(t.location, t.trigger_type), o = t.trigger_type === "occupied" ? "on" : "off", n = t.action_entity_id.includes(".") ? t.action_entity_id.split(".", 1)[0] : "homeassistant", r = {
    version: 2,
    location_id: t.location.id,
    trigger_type: t.trigger_type,
    require_dark: !!t.require_dark
  };
  await Ve(a, "post", i, {
    alias: t.name,
    description: `Managed by Topomation.
${In(r)}`,
    triggers: [
      {
        trigger: "state",
        entity_id: e,
        to: o
      }
    ],
    conditions: t.require_dark ? [
      {
        condition: "state",
        entity_id: "sun.sun",
        state: "below_horizon"
      }
    ] : [],
    actions: [
      {
        action: `${n}.${t.action_service}`,
        target: {
          entity_id: t.action_entity_id
        }
      }
    ],
    mode: "single"
  });
  const s = await Bn(a, i);
  return s && await Wn(a, s, t.trigger_type), {
    id: i,
    entity_id: (s == null ? void 0 : s.entity_id) || `automation.${i}`,
    name: t.name,
    trigger_type: t.trigger_type,
    action_entity_id: t.action_entity_id,
    action_service: t.action_service,
    require_dark: !!t.require_dark,
    enabled: !0
  };
}
async function Oi(a, t) {
  const e = typeof t == "string" ? t : t.id;
  try {
    await Ve(a, "delete", e);
    return;
  } catch (i) {
    if (typeof t == "string")
      throw i;
    try {
      const o = await a.callWS({
        type: "automation/config",
        entity_id: t.entity_id
      }), n = o == null ? void 0 : o.config;
      if (!n || typeof n != "object")
        throw i;
      const r = ni(
        {
          entity_id: t.entity_id
        },
        n
      );
      if (!r || r === e)
        throw i;
      await Ve(a, "delete", r);
    } catch {
      throw i;
    }
  }
}
console.log("[ht-location-inspector] module loaded");
var Ii, Ri;
try {
  (Ri = (Ii = import.meta) == null ? void 0 : Ii.hot) == null || Ri.accept(() => window.location.reload());
} catch {
}
const be = class be extends st {
  constructor() {
    super(...arguments), this._activeTab = "detection", this._sourcesDirty = !1, this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._actionRules = [], this._loadingActionRules = !1, this._nowEpochMs = Date.now(), this._actionToggleBusy = {}, this._actionServiceSelections = {}, this._actionDarkSelections = {}, this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._discardSourceChanges = () => {
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
      const i = t.get("location"), o = (i == null ? void 0 : i.id) || "", n = ((e = this.location) == null ? void 0 : e.id) || "";
      o !== n && (this._stagedSources = void 0, this._sourcesDirty = !1, this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {}, this._actionToggleBusy = {}, this._actionServiceSelections = {}, this.hass && this._loadEntityAreaAssignments()), this._loadActionRules();
    }
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const o = await Vn(this.hass, e);
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
          for (const r of i) {
            const s = typeof (r == null ? void 0 : r.id) == "string" ? r.id : void 0, c = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0;
            s && c && o.set(s, c);
          }
        const n = {};
        if (Array.isArray(e))
          for (const r of e) {
            const s = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : void 0;
            if (!s) continue;
            const c = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0, l = typeof (r == null ? void 0 : r.device_id) == "string" ? o.get(r.device_id) : void 0;
            n[s] = c || l || null;
          }
        this._entityAreaById = n;
      } catch (e) {
        console.debug("[ht-location-inspector] failed to load entity/device registry area mapping", e), this._entityAreaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, o = this._getLockState(), n = this._getOccupancyState(), r = (n == null ? void 0 : n.state) === "on", s = n ? r ? "Occupied" : n.state === "off" ? "Vacant" : "Unknown" : "Unknown", c = n ? this._resolveVacantAt(n.attributes || {}, r) : void 0, l = r ? c instanceof Date ? this._formatDateTime(c) : c === null ? "No timeout scheduled" : "Unknown" : void 0;
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
                      Vacant at ${l}
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
    var i, o, n;
    const e = t.ha_area_id;
    return e && ((n = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e]) != null && n.icon) ? this.hass.areas[e].icon : wn(t);
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
            var n;
            const o = (n = i == null ? void 0 : i.data) == null ? void 0 : n.entity_id;
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
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, o = (t.occupancy_sources || []).length, n = this._getLockState();
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
          ${n.isLocked ? _`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${n.lockedBy.length ? _`Held by ${n.lockedBy.join(", ")}.` : _`Occupancy is currently held by a lock.`}
              </div>
              ${n.lockModes.length ? _`
                    <div class="runtime-note">
                      Modes: ${n.lockModes.map((r) => this._lockModeLabel(r)).join(", ")}
                    </div>
                  ` : ""}
              ${n.directLocks.length ? _`
                    <div class="lock-directive-list">
                      ${n.directLocks.map((r) => _`
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
    const i = e.attributes || {}, o = e.state === "on", n = this._resolveVacantAt(i, o), r = o ? "Occupied" : e.state === "off" ? "Vacant" : "Unknown", s = o ? n instanceof Date ? this._formatDateTime(n) : n === null ? "No timeout scheduled" : "Unknown" : "-";
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
      return e && o.push("level"), i && o.push("color"), o.map((n) => ({
        key: this._sourceKey(t, n),
        entityId: t,
        signalKey: n
      }));
    }
    return ["playback", "volume", "mute"].map((e) => ({
      key: this._sourceKey(t, e),
      entityId: t,
      signalKey: e
    }));
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
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), o = /* @__PURE__ */ new Map();
    i.forEach((d, h) => o.set(this._sourceKeyFromSource(d), h));
    const n = [...this.location.entity_ids || []].sort(
      (d, h) => this._entityName(d).localeCompare(this._entityName(h))
    );
    new Set(n);
    const s = n.filter((d) => this._isCandidateEntity(d)).flatMap((d) => this._candidateItemsForEntity(d)), c = new Set(s.map((d) => d.key)), l = i.filter((d) => !c.has(this._sourceKeyFromSource(d))).map((d) => ({
      key: this._sourceKeyFromSource(d),
      entityId: d.entity_id,
      signalKey: d.signal_key
    })), u = [...s, ...l];
    return u.length ? _`
      <div class="candidate-list">
        ${u.map((d) => {
      const h = o.get(d.key), p = h !== void 0, f = p ? i[h] : void 0, m = p && f ? f : void 0, v = this._modeOptionsForEntity(d.entityId);
      return _`
            <div class="source-card ${p ? "enabled" : ""}">
              <div class="candidate-item">
                <div class="source-enable-control">
                  <input
                    type="checkbox"
                    class="source-enable-input"
                    aria-label="Include source"
                    .checked=${p}
                    @change=${($) => {
        const A = $.target.checked;
        A && !p ? this._addSourceWithDefaults(d.entityId, t, {
          resetExternalPicker: !1,
          signalKey: d.signalKey
        }) : !A && p && this._removeSource(h, t);
      }}
                  />
                </div>
                <div>
                  <div class="candidate-headline">
                    <div class="candidate-title">${this._candidateTitle(d.entityId, d.signalKey)}</div>
                    ${p && m && v.length > 1 ? _`
                          <div class="inline-mode-group">
                            <span class="inline-mode-label">Mode</span>
                            <select
                              class="inline-mode-select"
                              .value=${v.some(($) => $.value === m.mode) ? m.mode : v[0].value}
                              @change=${($) => {
        const A = $.target.value, M = this.hass.states[d.entityId], E = Tn(m, A, M);
        this._updateSourceDraft(t, h, { ...E, entity_id: m.entity_id });
      }}
                            >
                              ${v.map(($) => _`<option value=${$.value}>${$.label}</option>`)}
                            </select>
                          </div>
                        ` : ""}
                  </div>
                  <div class="candidate-meta">${d.entityId} • ${this._entityState(d.entityId)}</div>
                  ${(this._isMediaEntity(d.entityId) || d.entityId.startsWith("light.")) && d.signalKey ? _`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(d.signalKey)}</div>` : ""}
                </div>
              </div>
              ${p && f ? this._renderSourceEditor(t, f, h) : ""}
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
    const e = this._availableSourceAreas(), i = this._externalAreaId || "", o = i ? this._entitiesForArea(i) : [], n = this._externalEntityId || "", r = new Set(this._workingSources(t).map((d) => this._sourceKeyFromSource(d))), s = n ? this._defaultSignalKeyForEntity(n) : void 0, c = n ? this._sourceKey(n, s) : "", l = (u = this.location) != null && u.ha_area_id ? "Other Area" : "Source Area";
    return _`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">${l}</label>
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
            .value=${n}
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
          ?disabled=${this._savingSource || !n || (c ? r.has(c) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(n, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(n)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderSourceEditor(t, e, i) {
    const o = e, n = this._eventLabelsForSource(e), r = this._sourceKeyFromSource(e), s = this._supportsOffBehavior(e), c = t.default_timeout || 300, l = this._onTimeoutMemory[r], u = o.on_timeout === null ? l ?? c : o.on_timeout ?? l ?? c, d = Math.max(1, Math.min(120, Math.round(u / 60))), h = o.off_trailing ?? 0, p = Math.max(0, Math.min(120, Math.round(h / 60)));
    return _`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? _`<div class="media-signals">Signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${n.onBehavior}</label>
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
            <label for="source-on-timeout-${i}">${n.onTimeout}</label>
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
      const m = f.target.checked, v = this._onTimeoutMemory[r], $ = d * 60, A = v ?? $;
      m && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: o.on_timeout ?? A
      }), this._updateSourceDraft(t, i, {
        ...o,
        on_timeout: m ? null : A
      });
    }}
              />
              Indefinite (until ${n.offState})
            </label>
          </div>

          ${s ? _`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${n.offBehavior}</label>
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
                  <label for="source-off-trailing-${i}">${n.offDelay}</label>
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
      (n) => {
        const r = this._isManagedActionEnabled(n, t), s = this._actionToggleKey(n, t), c = !!this._actionToggleBusy[s], l = this._selectedManagedActionService(n, t), u = this._selectedManagedActionRequireDark(n, t), d = this._actionServiceOptions(n, t);
        return _`
                    <div class="source-item action-device-row ${r ? "enabled" : ""}">
                      <div class="action-include-control">
                        <input
                          type="checkbox"
                          class="action-include-input"
                          .checked=${r}
                          ?disabled=${c || this._loadingActionRules}
                          aria-label=${`Include ${this._entityName(n)}`}
                          @change=${(h) => this._handleManagedActionToggle(
          n,
          t,
          h.target.checked
        )}
                        />
                      </div>
                      <div class="source-icon">
                        <ha-icon .icon=${this._deviceIcon(n)}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${this._entityName(n)}</div>
                        <div class="source-details">
                          Entity: ${n}
                        </div>
                        <div class="source-details">
                          Current state: ${this._entityState(n)}
                        </div>
                      </div>
                      <div class="action-controls">
                        <select
                          class="action-service-select"
                          .value=${$n(l)}
                          ?disabled=${c || this._loadingActionRules}
                          @change=${(h) => this._handleManagedActionServiceChange(
          n,
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
                            ?disabled=${c || this._loadingActionRules}
                            @change=${(h) => this._handleManagedActionDarkChange(
          n,
          t,
          h.target.checked
        )}
                          />
                          Only when dark
                        </label>
                        ${c ? _`<span class="text-muted">Saving...</span>` : ""}
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
      const o = this._actionDeviceType(e) || "zzzz", n = this._actionDeviceType(i) || "zzzz";
      return o !== n ? o.localeCompare(n) : this._entityName(e).localeCompare(this._entityName(i));
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
    const n = Array.isArray(o.supported_color_modes) ? o.supported_color_modes : [], r = n.some(
      (h) => ["hs", "xy", "rgb", "rgbw", "rgbww", "color_temp"].includes(String(h))
    ), s = Array.isArray(o.hs_color) || Array.isArray(o.xy_color) || Array.isArray(o.rgb_color) || typeof o.color_temp_kelvin == "number" || typeof o.color_temp == "number";
    if (r || s) return "color_light";
    const c = n.some((h) => String(h) !== "onoff"), l = typeof o.brightness == "number" || typeof o.brightness_pct == "number" || typeof o.brightness_step == "number" || typeof o.brightness_step_pct == "number";
    return c || l ? "dimmer" : "light";
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
      const n = this._defaultManagedActionService(t, e);
      return [
        { value: "media_stop", label: "Stop" },
        { value: "turn_off", label: "Turn off" }
      ].sort((r, s) => r.value === n ? -1 : s.value === n ? 1 : 0);
    }
    const o = this._defaultManagedActionService(t, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" },
      { value: "toggle", label: "Toggle" }
    ].sort((n, r) => n.value === o ? -1 : r.value === o ? 1 : 0);
  }
  _actionServiceLabel(t) {
    return t.split("_").map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
  }
  _selectedManagedActionService(t, e) {
    const i = this._actionToggleKey(t, e), o = this._actionServiceSelections[i];
    if (o) return o;
    const n = this._rulesForManagedActionEntity(t, e), r = n.find(
      (c) => c.enabled && typeof c.action_service == "string" && c.action_service.length > 0
    );
    if (r != null && r.action_service) return r.action_service;
    const s = n.find(
      (c) => typeof c.action_service == "string" && c.action_service.length > 0
    );
    return s != null && s.action_service ? s.action_service : this._defaultManagedActionService(t, e);
  }
  _selectedManagedActionRequireDark(t, e) {
    const i = this._actionToggleKey(t, e);
    if (Object.prototype.hasOwnProperty.call(this._actionDarkSelections, i))
      return !!this._actionDarkSelections[i];
    const o = this._rulesForManagedActionEntity(t, e), n = o.find((s) => s.enabled);
    if (n)
      return !!n.require_dark;
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
      if (await this._loadActionRules() && t())
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
    const i = ((s = this.location) == null ? void 0 : s.name) || "Location", o = this._entityName(t), n = this._selectedManagedActionService(t, e).replace(/_/g, " ");
    return `${i} ${e === "occupied" ? "Occupied" : "Vacant"}: ${o} (${n})`;
  }
  async _replaceManagedActionRules(t, e, i, o) {
    if (!this.location) return;
    const n = this._rulesForManagedActionEntity(t, e);
    return n.length > 0 && await Promise.all(n.map((s) => Oi(this.hass, s))), await jn(this.hass, {
      location: this.location,
      name: this._managedRuleName(t, e),
      trigger_type: e,
      action_entity_id: t,
      action_service: i,
      require_dark: o
    });
  }
  _setManagedActionRuleLocal(t, e, i, o, n) {
    const r = {
      ...t,
      trigger_type: i,
      action_entity_id: e,
      action_service: o,
      require_dark: n,
      enabled: !0
    }, s = this._actionRules.filter(
      (c) => !(c.trigger_type === i && c.action_entity_id === e)
    );
    this._actionRules = [...s, r];
  }
  _removeManagedActionRulesLocal(t, e) {
    this._actionRules = this._actionRules.filter(
      (i) => !(i.trigger_type === e && i.action_entity_id === t)
    );
  }
  async _handleManagedActionServiceChange(t, e, i) {
    var s, c, l;
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
        locationId: (c = this.location) == null ? void 0 : c.id,
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
        locationId: (l = this.location) == null ? void 0 : l.id,
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
    var s, c, l;
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
        locationId: (c = this.location) == null ? void 0 : c.id,
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
        locationId: (l = this.location) == null ? void 0 : l.id,
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
    const n = Date.now();
    try {
      const s = this._rulesForManagedActionEntity(t, e), c = this._selectedManagedActionService(t, e), l = this._selectedManagedActionRequireDark(t, e);
      if (console.debug("[ht-location-inspector] managed action toggle start", {
        locationId: this.location.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        actionService: c,
        requireDark: l,
        existingRuleCount: s.length
      }), i) {
        const d = await this._replaceManagedActionRules(
          t,
          e,
          c,
          l
        );
        d && this._setManagedActionRuleLocal(
          d,
          t,
          e,
          c,
          l
        );
      } else s.length > 0 && (await Promise.all(s.map((d) => Oi(this.hass, d))), this._removeManagedActionRulesLocal(t, e));
      const u = await this._reloadActionRulesUntil(
        () => this._isManagedActionEnabled(t, e) === i && (!i || this._isManagedActionServiceSelected(t, e, c) && this._isManagedActionRequireDarkSelected(t, e, l))
      );
      console.debug("[ht-location-inspector] managed action toggle complete", {
        locationId: this.location.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        actionService: c,
        requireDark: l,
        converged: u,
        duration_ms: Date.now() - n
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
      const { [o]: s, ...c } = this._actionToggleBusy;
      this._actionToggleBusy = c, this.requestUpdate();
    }
  }
  _workingSources(t) {
    return this._stagedSources ? [...this._stagedSources] : [...t.occupancy_sources || []];
  }
  _setWorkingSources(t, e) {
    const i = e.map((n) => this._normalizeSource(n.entity_id, n)), o = { ...this._onTimeoutMemory };
    for (const n of i)
      typeof n.on_timeout == "number" && n.on_timeout > 0 && (o[this._sourceKeyFromSource(n)] = n.on_timeout);
    this._onTimeoutMemory = o, this._stagedSources = i, this._sourcesDirty = !0, this.requestUpdate();
  }
  _updateSourceDraft(t, e, i) {
    const o = this._workingSources(t), n = o[e];
    if (!n) return;
    const r = this._modeOptionsForEntity(n.entity_id).map((c) => c.value), s = this._normalizeSource(
      n.entity_id,
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
    const n = { ...this._onTimeoutMemory };
    delete n[this._sourceKeyFromSource(o)], this._onTimeoutMemory = n, this._setWorkingSources(e, i);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location || this._isFloorLocation()) return;
    const o = this._workingSources(e), n = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (o.some((u) => this._sourceKeyFromSource(u) === n))
      return;
    const r = this.hass.states[t];
    if (!r) {
      this._showToast(`Entity not found: ${t}`, "error");
      return;
    }
    let c = fo(r);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const l = this._normalizeSource(t, c);
    this._setWorkingSources(e, [...o, l]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate());
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
    const i = this._isMediaEntity(t), o = this._isDimmableEntity(t), n = this._isColorCapableEntity(t), r = (d = e.source_id) != null && d.includes("::") ? e.source_id.split("::")[1] : void 0, s = this._defaultSignalKeyForEntity(t), c = e.signal_key || r || s;
    let l;
    (i && (c === "playback" || c === "volume" || c === "mute") || (o || n) && (c === "power" || c === "level" || c === "color")) && (l = c);
    const u = e.source_id || this._sourceKey(t, l);
    return {
      entity_id: t,
      source_id: u,
      signal_key: l,
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
    var o, n;
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = ((n = this.hass) == null ? void 0 : n.areas) || {};
    return Object.values(e).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, s) => r.name.localeCompare(s.name));
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n))) : Object.keys(e).filter((o) => {
      var r, s;
      const n = this._entityAreaById[o];
      return n !== void 0 ? n === t : ((s = (r = e[o]) == null ? void 0 : r.attributes) == null ? void 0 : s.area_id) === t;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n)));
  }
  _isCandidateEntity(t) {
    var n, r;
    const e = (r = (n = this.hass) == null ? void 0 : n.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = e.attributes || {};
    if (i.device_class === "occupancy" && i.location_id) return !1;
    const o = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o))
      return !0;
    if (o === "binary_sensor") {
      const s = String(i.device_class || "");
      return s ? [
        "motion",
        "occupancy",
        "presence",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock"
      ].includes(s) : !0;
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
    const n = String(t || "").trim(), r = o.map((s) => String((s == null ? void 0 : s.source_id) || "").trim()).filter((s) => s.length > 0 && s !== n);
    return Array.from(new Set(r));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, o = e.lock_modes, n = e.direct_locks, r = Array.isArray(i) ? i.map((l) => String(l)) : [], s = Array.isArray(o) ? o.map((l) => String(l)) : [], c = Array.isArray(n) ? n.map((l) => ({
      sourceId: String((l == null ? void 0 : l.source_id) || "unknown"),
      mode: String((l == null ? void 0 : l.mode) || "freeze"),
      scope: String((l == null ? void 0 : l.scope) || "self")
    })).sort(
      (l, u) => `${l.sourceId}:${l.mode}:${l.scope}`.localeCompare(`${u.sourceId}:${u.mode}:${u.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: r,
      lockModes: s,
      directLocks: c
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
    let n = !1, r;
    for (const s of o) {
      const c = s == null ? void 0 : s.expires_at;
      if (c == null) {
        n = !0;
        continue;
      }
      const l = this._parseDateValue(c);
      l && (!r || l.getTime() > r.getTime()) && (r = l);
    }
    return n ? null : r;
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
    const i = Math.floor(e / 86400), o = Math.floor(e % 86400 / 3600), n = Math.floor(e % 3600 / 60), r = e % 60, s = [];
    return i > 0 && s.push(`${i}d`), o > 0 && s.push(`${o}h`), n > 0 && s.length < 2 && s.push(`${n}m`), (s.length === 0 || i === 0 && o === 0 && n === 0) && s.push(`${r}s`), s.slice(0, 2).join(" ");
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
    const i = t.mode === "any_change" ? "Any change" : "Specific states", o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0, r = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", s = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(n)})` : "OFF: ignore";
    return `${i} • ${r} • ${s}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(_`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(_`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      _`<span class="event-chip off">OFF -> clear (${this._formatDuration(n)})</span>`
    ) : i.push(_`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t], i = (e == null ? void 0 : e.attributes) || {}, o = t.split(".", 1)[0], n = String(i.device_class || "");
    return o === "person" || o === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : o === "binary_sensor" ? ["door", "garage_door", "opening", "window", "motion", "presence", "occupancy"].includes(n) ? [{ value: "specific_states", label: "Specific states" }] : [
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
    var l, u;
    const e = t.entity_id, i = (u = (l = this.hass) == null ? void 0 : l.states) == null ? void 0 : u[e], o = (i == null ? void 0 : i.attributes) || {}, n = e.split(".", 1)[0], r = String(o.device_class || "");
    let s = "ON", c = "OFF";
    if (n === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(r))
      s = "Open", c = "Closed";
    else if (n === "binary_sensor" && r === "motion")
      s = "Motion", c = "No motion";
    else if (n === "binary_sensor" && ["presence", "occupancy"].includes(r))
      s = "Detected", c = "Not detected";
    else if (n === "person" || n === "device_tracker")
      s = "Home", c = "Away";
    else {
      if (n === "media_player")
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
      if (n === "light" && t.signal_key === "level")
        return {
          onState: "Level change",
          offState: "No level change",
          onBehavior: "Level change behavior",
          onTimeout: "Level timeout",
          offBehavior: "No-level behavior",
          offDelay: "No-level delay"
        };
      if (n === "light" && t.signal_key === "color")
        return {
          onState: "Color change",
          offState: "No color change",
          onBehavior: "Color change behavior",
          onTimeout: "Color timeout",
          offBehavior: "No-color behavior",
          offDelay: "No-color delay"
        };
      (n === "light" && t.signal_key === "power" || n === "light" || n === "switch" || n === "fan") && (s = "On", c = "Off");
    }
    return {
      onState: s,
      offState: c,
      onBehavior: `${s} behavior`,
      onTimeout: `${s} timeout`,
      offBehavior: `${c} behavior`,
      offDelay: `${c} delay`
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
          const r = (this.location.modules.occupancy || {}).default_timeout || 300, s = t.on_timeout === null ? r : t.on_timeout ?? r, c = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: {
              location_id: this.location.id,
              source_id: c,
              timeout: s
            }
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: c,
                timeout: s
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${c}`, "success");
          return;
        }
        const i = t.off_trailing ?? 0, o = t.source_id || t.entity_id, n = i <= 0;
        if (await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: n ? "vacate" : "clear",
          service_data: n ? {
            location_id: this.location.id
          } : {
            location_id: this.location.id,
            source_id: o,
            trailing_timeout: i
          }
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: n ? "vacate" : "clear",
              locationId: this.location.id,
              sourceId: o,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), n)
          this._showToast(`Vacated ${o}`, "success");
        else {
          const r = this._activeContributorsExcluding(o);
          if (r.length > 0) {
            const s = r.slice(0, 2).join(", "), c = r.length > 2 ? ` +${r.length - 2} more` : "";
            this._showToast(`Cleared ${o}; still occupied by ${s}${c}`, "error");
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
        await this.hass.callWS({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: t,
          config: e
        }), this.location.modules[t] = e, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(t) {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, i = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: i });
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
    const n = o * 60, r = e.closest(".config-value");
    if (r) {
      const c = r.querySelector("input.timeout-slider");
      c && (c.value = String(o));
      const l = r.querySelector("input.input");
      l && (l.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const s = this.location.modules.occupancy || {};
    this._updateConfig({ ...s, default_timeout: n });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && ct(this.location) === "floor";
  }
};
be.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  forcedTab: { type: String }
}, be.styles = [
  Se,
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
let je = be;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", je);
  } catch (a) {
    console.error("[ht-location-inspector] failed to define element", a);
  }
console.log("[ht-location-dialog] module loaded");
var Pi, Ni;
try {
  (Ni = (Pi = import.meta) == null ? void 0 : Pi.hot) == null || Ni.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends st {
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
      const n = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", n, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((r) => {
        var s, c;
        return `${r.name}(${(c = (s = r.modules) == null ? void 0 : s._meta) == null ? void 0 : c.type})`;
      })), this.open && !n) {
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
        var o, n;
        const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const r = e.shadowRoot.querySelector('input[type="text"]');
          if (r) {
            console.log("[LocationDialog] Focusing input:", r), r.focus(), r.select();
            return;
          }
        }
        const i = (n = this.shadowRoot) == null ? void 0 : n.querySelector('input[type="text"]');
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
    const t = this._config.type, e = We(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const o = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: o,
      totalLocations: this.locations.length
    }), o.length === 0) return [];
    const n = this.locations.filter((r) => {
      if (r.is_explicit_root) return !1;
      const s = ct(r);
      return o.includes(s);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", n.length, n.map((r) => r.label)), n;
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = We(this._config.type);
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
      this.location ? (await this.hass.callWS({
        type: "topomation/locations/update",
        location_id: this.location.id,
        changes: {
          name: this._config.name,
          parent_id: this._submitParentId()
        }
      }), await this.hass.callWS({
        type: "topomation/locations/set_module_config",
        location_id: this.location.id,
        module_id: "_meta",
        config: {
          type: this._config.type
        }
      })) : await this.hass.callWS({
        type: "topomation/locations/create",
        name: this._config.name,
        parent_id: this._submitParentId(),
        meta: {
          type: this._config.type
        }
      }), this.dispatchEvent(new CustomEvent("saved", {
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
      bubbles: !0,
      composed: !0
    }));
  }
};
ye.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, ye.styles = [
  Se,
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
let Ye = ye;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Ye);
console.log("[topomation-panel] module loaded");
var Bi, Fi;
try {
  (Fi = (Bi = import.meta) == null ? void 0 : Bi.hot) == null || Fi.accept(() => window.location.reload());
} catch {
}
const we = class we extends st {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._hasLoaded = !1, this._loadSeq = 0, this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleNewLocation = (t) => {
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
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen;
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
    super.connectedCallback(), console.log("TopomationPanel connected"), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._consistencyReloadTimer && (clearTimeout(this._consistencyReloadTimer), this._consistencyReloadTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0);
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
      (s) => s.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), o = e === "location" ? void 0 : e, n = "Automation", r = this._deleteDisabledReason(t);
    return _`
      <div class="panel-container">
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

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${n}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${t}
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
      const n = await Promise.race([
        this.hass.callWS({
          type: "topomation/locations/list"
        }),
        new Promise(
          (u, d) => setTimeout(() => d(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      console.log("WebSocket result:", n);
      const r = n;
      if (!r || !r.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq: e, current: this._loadSeq });
        return;
      }
      const s = /* @__PURE__ */ new Map();
      for (const u of r.locations) s.set(u.id, u);
      const c = Array.from(s.values());
      c.length !== r.locations.length && console.warn("[Panel] Deduped locations from backend", {
        before: r.locations.length,
        after: c.length
      });
      const l = c.filter((u) => !u.is_explicit_root);
      l.length !== c.length && console.log("[Panel] Hidden explicit root locations from manager tree", {
        hidden: c.length - l.length
      }), this._locations = [...l], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._locationsVersion += 1, console.log("Loaded locations:", this._locations.length, this._locations), this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((u) => u.id === this._selectedId)) && (this._selectedId = (o = this._locations[0]) == null ? void 0 : o.id);
    } catch (n) {
      console.error("Failed to load locations:", n), this._error = n.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (n == null ? void 0 : n.message) || n);
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
    const { locationId: t, localName: e, haName: i } = this._renameConflict, o = this._locations.find((n) => n.id === t);
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
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = e ? this._locations.find((n) => n.id === e) : this._getSelectedLocation();
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
        await this.hass.callWS({
          type: "topomation/locations/reorder",
          location_id: e,
          new_parent_id: i ?? null,
          new_index: o
        }), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (n) {
        console.error("Failed to move location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to move location", "error");
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
    var o, n;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((n = t == null ? void 0 : t.detail) != null && n.lock);
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
          service_data: {
            location_id: e,
            source_id: "manual_ui"
          }
        }), this._logEvent("ui", s, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const c = ((r = this._locations.find((l) => l.id === e)) == null ? void 0 : r.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (s) {
        console.error("Failed to toggle lock:", s), this._showToast((s == null ? void 0 : s.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy" || String(n == null ? void 0 : n.location_id) !== String(t)) continue;
      const r = Array.isArray(n == null ? void 0 : n.locked_by) ? n.locked_by.map((s) => String(s)) : [];
      return {
        isLocked: !!(n != null && n.is_locked),
        lockedBy: r
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var o, n;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((n = t == null ? void 0 : t.detail) != null && n.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var u, d;
      const r = this._locations.find((h) => h.id === e), s = (r == null ? void 0 : r.name) || e, { isLocked: c, lockedBy: l } = this._getLocationLockState(e);
      if (c) {
        const h = l.length ? ` (${l.join(", ")})` : "";
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
          service_data: p
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
        await this.hass.callWS({
          type: "topomation/locations/update",
          location_id: e,
          changes: { name: String(i) }
        }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(`Renamed to "${i}"`, "success");
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
        const n = this._selectedId === e.id, r = e.parent_id ?? void 0;
        if (await this.hass.callWS({
          type: "topomation/locations/delete",
          location_id: e.id
        }), await this._loadLocations(!0), this._locationsVersion += 1, n) {
          const s = (r && this._locations.some((c) => c.id === r) ? r : (o = this._locations[0]) == null ? void 0 : o.id) ?? void 0;
          this._selectedId = s;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (n) {
        console.error("Failed to delete location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to delete location", "error");
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
        this._unsubStateChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var s, c, l, u, d, h;
            const e = (s = t == null ? void 0 : t.data) == null ? void 0 : s.entity_id;
            if (!e) return;
            const i = (c = t == null ? void 0 : t.data) == null ? void 0 : c.new_state, o = (i == null ? void 0 : i.attributes) || {};
            if (e.startsWith("binary_sensor.") && o.device_class === "occupancy" && o.location_id && this._setOccupancyState(o.location_id, (i == null ? void 0 : i.state) === "on"), !this._shouldTrackEntity(e)) return;
            const n = (u = (l = t == null ? void 0 : t.data) == null ? void 0 : l.new_state) == null ? void 0 : u.state, r = (h = (d = t == null ? void 0 : t.data) == null ? void 0 : d.old_state) == null ? void 0 : h.state;
            this._logEvent("ha", "state_changed", { entityId: e, oldState: r, newState: n });
          },
          "state_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to state_changed events", t), this._logEvent("error", "subscribe failed: state_changed", String(t));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var o, n;
            const e = (o = t == null ? void 0 : t.data) == null ? void 0 : o.location_id, i = (n = t == null ? void 0 : t.data) == null ? void 0 : n.occupied;
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
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy") continue;
      const r = n.location_id;
      r && (t[r] = (o == null ? void 0 : o.state) === "on");
    }
    return t;
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
    for (const n of this._locations) {
      for (const s of n.entity_ids || []) e.add(s);
      const r = ((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const s of r) e.add(s.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, o;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const n of this._locations) {
      if (!e.has(n.id)) continue;
      if ((n.entity_ids || []).includes(t) || (((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((s) => s.entity_id === t)) return !0;
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
      t.map(([o, n]) => this._saveChange(o, n))
    ), i = e.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([o, n], r) => {
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
        await this.hass.callWS({
          type: "topomation/locations/update",
          location_id: t,
          changes: e.updated
        });
        break;
      case "delete":
        await this.hass.callWS({
          type: "topomation/locations/delete",
          location_id: t
        });
        break;
      case "create":
        await this.hass.callWS({
          type: "topomation/locations/create",
          ...e.updated
        });
        break;
    }
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
we.properties = {
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
  _occupancyStateByLocation: { state: !0 }
}, we.styles = [
  Se,
  Gt`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      /* Tree Panel ~40% (min 300px) - from docs/history/2026.02.24-ui-design.md Section 2.1 */
      .panel-left {
        flex: 0 0 40%;
        min-width: 300px;
        max-width: 500px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
          min-width: 280px;
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
          flex: 1;
          min-width: unset;
          max-width: unset;
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
let Xe = we;
if (!customElements.get("topomation-panel"))
  try {
    console.log("[topomation-panel] registering custom element"), customElements.define("topomation-panel", Xe);
  } catch (a) {
    console.error("[topomation-panel] failed to define element", a);
  }
export {
  Xe as TopomationPanel
};
