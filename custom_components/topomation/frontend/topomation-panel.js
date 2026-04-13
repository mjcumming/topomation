/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le = globalThis, hi = le.ShadowRoot && (le.ShadyCSS === void 0 || le.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, pi = Symbol(), wi = /* @__PURE__ */ new WeakMap();
let an = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== pi) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (hi && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = wi.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && wi.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const In = (c) => new an(typeof c == "string" ? c : c + "", void 0, pi), It = (c, ...t) => {
  const e = c.length === 1 ? c[0] : t.reduce((i, n, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + c[o + 1], c[0]);
  return new an(e, c, pi);
}, On = (c, t) => {
  if (hi) c.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), n = le.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = e.cssText, c.appendChild(i);
  }
}, Si = hi ? (c) => c : (c) => c instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return In(e);
})(c) : c;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Pn, defineProperty: zn, getOwnPropertyDescriptor: Mn, getOwnPropertyNames: Fn, getOwnPropertySymbols: Nn, getPrototypeOf: Bn } = Object, gt = globalThis, $i = gt.trustedTypes, jn = $i ? $i.emptyScript : "", Le = gt.reactiveElementPolyfillSupport, jt = (c, t) => c, Xe = { toAttribute(c, t) {
  switch (t) {
    case Boolean:
      c = c ? jn : null;
      break;
    case Object:
    case Array:
      c = c == null ? c : JSON.stringify(c);
  }
  return c;
}, fromAttribute(c, t) {
  let e = c;
  switch (t) {
    case Boolean:
      e = c !== null;
      break;
    case Number:
      e = c === null ? null : Number(c);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(c);
      } catch {
        e = null;
      }
  }
  return e;
} }, rn = (c, t) => !Pn(c, t), ki = { attribute: !0, type: String, converter: Xe, reflect: !1, useDefault: !1, hasChanged: rn };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), gt.litPropertyMetadata ?? (gt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let At = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ki) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, e);
      n !== void 0 && zn(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: n, set: o } = Mn(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: n, set(a) {
      const r = n == null ? void 0 : n.call(this);
      o == null || o.call(this, a), this.requestUpdate(t, r, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ki;
  }
  static _$Ei() {
    if (this.hasOwnProperty(jt("elementProperties"))) return;
    const t = Bn(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(jt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(jt("properties"))) {
      const e = this.properties, i = [...Fn(e), ...Nn(e)];
      for (const n of i) this.createProperty(n, e[n]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, n] of e) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const n = this._$Eu(e, i);
      n !== void 0 && this._$Eh.set(n, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const n of i) e.unshift(Si(n));
    } else t !== void 0 && e.push(Si(t));
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
    return On(t, this.constructor.elementStyles), t;
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
    var o;
    const i = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, i);
    if (n !== void 0 && i.reflect === !0) {
      const a = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : Xe).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var o, a;
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), s = typeof r.converter == "function" ? { fromAttribute: r.converter } : ((o = r.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? r.converter : Xe;
      this._$Em = n;
      const l = s.fromAttribute(e, r.type);
      this[n] = l ?? ((a = this._$Ej) == null ? void 0 : a.get(n)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var n;
    if (t !== void 0) {
      const o = this.constructor, a = this[t];
      if (i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? rn)(a, e) || i.useDefault && i.reflect && a === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: n, wrapped: o }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), n === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const n = this.constructor.elementProperties;
      if (n.size > 0) for (const [o, a] of n) {
        const { wrapped: r } = a, s = this[o];
        r !== !0 || this._$AL.has(o) || s === void 0 || this.C(o, void 0, a, s);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((n) => {
        var o;
        return (o = n.hostUpdate) == null ? void 0 : o.call(n);
      }), this.update(e)) : this._$EM();
    } catch (n) {
      throw t = !1, this._$EM(), n;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var n;
      return (n = i.hostUpdated) == null ? void 0 : n.call(i);
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
At.elementStyles = [], At.shadowRootOptions = { mode: "open" }, At[jt("elementProperties")] = /* @__PURE__ */ new Map(), At[jt("finalized")] = /* @__PURE__ */ new Map(), Le == null || Le({ ReactiveElement: At }), (gt.reactiveElementVersions ?? (gt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, me = Ut.trustedTypes, Ai = me ? me.createPolicy("lit-html", { createHTML: (c) => c }) : void 0, sn = "$lit$", dt = `lit$${Math.random().toFixed(9).slice(2)}$`, cn = "?" + dt, Un = `<${cn}>`, wt = document, Kt = () => wt.createComment(""), Yt = (c) => c === null || typeof c != "object" && typeof c != "function", gi = Array.isArray, Wn = (c) => gi(c) || typeof (c == null ? void 0 : c[Symbol.iterator]) == "function", Ie = `[ 	
\f\r]`, zt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ti = /-->/g, Ei = />/g, ft = RegExp(`>|${Ie}(?:([^\\s"'>=/]+)(${Ie}*=${Ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ri = /'/g, Di = /"/g, ln = /^(?:script|style|textarea|title)$/i, Vn = (c) => (t, ...e) => ({ _$litType$: c, strings: t, values: e }), g = Vn(1), St = Symbol.for("lit-noChange"), N = Symbol.for("lit-nothing"), Ci = /* @__PURE__ */ new WeakMap(), bt = wt.createTreeWalker(wt, 129);
function dn(c, t) {
  if (!gi(c) || !c.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ai !== void 0 ? Ai.createHTML(t) : t;
}
const Hn = (c, t) => {
  const e = c.length - 1, i = [];
  let n, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = zt;
  for (let r = 0; r < e; r++) {
    const s = c[r];
    let l, d, u = -1, p = 0;
    for (; p < s.length && (a.lastIndex = p, d = a.exec(s), d !== null); ) p = a.lastIndex, a === zt ? d[1] === "!--" ? a = Ti : d[1] !== void 0 ? a = Ei : d[2] !== void 0 ? (ln.test(d[2]) && (n = RegExp("</" + d[2], "g")), a = ft) : d[3] !== void 0 && (a = ft) : a === ft ? d[0] === ">" ? (a = n ?? zt, u = -1) : d[1] === void 0 ? u = -2 : (u = a.lastIndex - d[2].length, l = d[1], a = d[3] === void 0 ? ft : d[3] === '"' ? Di : Ri) : a === Di || a === Ri ? a = ft : a === Ti || a === Ei ? a = zt : (a = ft, n = void 0);
    const _ = a === ft && c[r + 1].startsWith("/>") ? " " : "";
    o += a === zt ? s + Un : u >= 0 ? (i.push(l), s.slice(0, u) + sn + s.slice(u) + dt + _) : s + dt + (u === -2 ? r : _);
  }
  return [dn(c, o + (c[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Xt {
  constructor({ strings: t, _$litType$: e }, i) {
    let n;
    this.parts = [];
    let o = 0, a = 0;
    const r = t.length - 1, s = this.parts, [l, d] = Hn(t, e);
    if (this.el = Xt.createElement(l, i), bt.currentNode = this.el.content, e === 2 || e === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = bt.nextNode()) !== null && s.length < r; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(sn)) {
          const p = d[a++], _ = n.getAttribute(u).split(dt), h = /([.?@])?(.*)/.exec(p);
          s.push({ type: 1, index: o, name: h[2], strings: _, ctor: h[1] === "." ? Gn : h[1] === "?" ? Kn : h[1] === "@" ? Yn : Ee }), n.removeAttribute(u);
        } else u.startsWith(dt) && (s.push({ type: 6, index: o }), n.removeAttribute(u));
        if (ln.test(n.tagName)) {
          const u = n.textContent.split(dt), p = u.length - 1;
          if (p > 0) {
            n.textContent = me ? me.emptyScript : "";
            for (let _ = 0; _ < p; _++) n.append(u[_], Kt()), bt.nextNode(), s.push({ type: 2, index: ++o });
            n.append(u[p], Kt());
          }
        }
      } else if (n.nodeType === 8) if (n.data === cn) s.push({ type: 2, index: o });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(dt, u + 1)) !== -1; ) s.push({ type: 7, index: o }), u += dt.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = wt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function Dt(c, t, e = c, i) {
  var a, r;
  if (t === St) return t;
  let n = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const o = Yt(t) ? void 0 : t._$litDirective$;
  return (n == null ? void 0 : n.constructor) !== o && ((r = n == null ? void 0 : n._$AO) == null || r.call(n, !1), o === void 0 ? n = void 0 : (n = new o(c), n._$AT(c, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = n : e._$Cl = n), n !== void 0 && (t = Dt(c, n._$AS(c, t.values), n, i)), t;
}
let qn = class {
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
    const { el: { content: e }, parts: i } = this._$AD, n = ((t == null ? void 0 : t.creationScope) ?? wt).importNode(e, !0);
    bt.currentNode = n;
    let o = bt.nextNode(), a = 0, r = 0, s = i[0];
    for (; s !== void 0; ) {
      if (a === s.index) {
        let l;
        s.type === 2 ? l = new Ot(o, o.nextSibling, this, t) : s.type === 1 ? l = new s.ctor(o, s.name, s.strings, this, t) : s.type === 6 && (l = new Xn(o, this, t)), this._$AV.push(l), s = i[++r];
      }
      a !== (s == null ? void 0 : s.index) && (o = bt.nextNode(), a++);
    }
    return bt.currentNode = wt, n;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class Ot {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, n) {
    this.type = 2, this._$AH = N, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = n, this._$Cv = (n == null ? void 0 : n.isConnected) ?? !0;
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
    t = Dt(this, t, e), Yt(t) ? t === N || t == null || t === "" ? (this._$AH !== N && this._$AR(), this._$AH = N) : t !== this._$AH && t !== St && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Wn(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== N && Yt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(wt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: e, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Xt.createElement(dn(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === n) this._$AH.p(e);
    else {
      const a = new qn(n, this), r = a.u(this.options);
      a.p(e), this.T(r), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = Ci.get(t.strings);
    return e === void 0 && Ci.set(t.strings, e = new Xt(t)), e;
  }
  k(t) {
    gi(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, n = 0;
    for (const o of t) n === e.length ? e.push(i = new Ot(this.O(Kt()), this.O(Kt()), this, this.options)) : i = e[n], i._$AI(o), n++;
    n < e.length && (this._$AR(i && i._$AB.nextSibling, n), e.length = n);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const n = t.nextSibling;
      t.remove(), t = n;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class Ee {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, n, o) {
    this.type = 1, this._$AH = N, this._$AN = void 0, this.element = t, this.name = e, this._$AM = n, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = N;
  }
  _$AI(t, e = this, i, n) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = Dt(this, t, e, 0), a = !Yt(t) || t !== this._$AH && t !== St, a && (this._$AH = t);
    else {
      const r = t;
      let s, l;
      for (t = o[0], s = 0; s < o.length - 1; s++) l = Dt(this, r[i + s], e, s), l === St && (l = this._$AH[s]), a || (a = !Yt(l) || l !== this._$AH[s]), l === N ? t = N : t !== N && (t += (l ?? "") + o[s + 1]), this._$AH[s] = l;
    }
    a && !n && this.j(t);
  }
  j(t) {
    t === N ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Gn extends Ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === N ? void 0 : t;
  }
}
class Kn extends Ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== N);
  }
}
class Yn extends Ee {
  constructor(t, e, i, n, o) {
    super(t, e, i, n, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Dt(this, t, e, 0) ?? N) === St) return;
    const i = this._$AH, n = t === N && i !== N || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== N && (i === N || n);
    n && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Xn {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Dt(this, t);
  }
}
const Qn = { I: Ot }, Oe = Ut.litHtmlPolyfillSupport;
Oe == null || Oe(Xt, Ot), (Ut.litHtmlVersions ?? (Ut.litHtmlVersions = [])).push("3.3.1");
const Zn = (c, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const o = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = n = new Ot(t.insertBefore(Kt(), o), o, void 0, e ?? {});
  }
  return n._$AI(c), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xt = globalThis;
let ot = class extends At {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Zn(e, this.renderRoot, this.renderOptions);
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
    return St;
  }
};
var Qi;
ot._$litElement$ = !0, ot.finalized = !0, (Qi = xt.litElementHydrateSupport) == null || Qi.call(xt, { LitElement: ot });
const Pe = xt.litElementPolyfillSupport;
Pe == null || Pe({ LitElement: ot });
(xt.litElementVersions ?? (xt.litElementVersions = [])).push("4.2.1");
const Qt = It`
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
`, Jn = {
  room: "area"
};
function to(c) {
  const t = String(c ?? "area").trim().toLowerCase(), e = Jn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" || e === "property" ? e : "area";
}
function C(c) {
  var t, e;
  return to((e = (t = c.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function Qe(c) {
  return c === "property" ? ["root"] : c === "floor" ? ["root", "building", "property"] : c === "building" || c === "grounds" ? ["root", "property"] : c === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds", "property"] : ["root", "floor", "area", "building", "grounds", "property"];
}
function eo(c, t) {
  return Qe(c).includes(t);
}
function io(c) {
  var s;
  const { locations: t, locationId: e, newParentId: i } = c;
  if (i === e || i && Ze(t, e, i)) return !1;
  const n = new Map(t.map((l) => [l.id, l])), o = n.get(e);
  if (!o || i && !n.get(i) || i && ((s = n.get(i)) != null && s.is_explicit_root)) return !1;
  const a = C(o);
  if (a === "property")
    return i === null;
  if (a === "building" || a === "grounds") {
    if (i === null) return !0;
    const l = n.get(i);
    return l ? C(l) === "property" : !1;
  }
  const r = i === null ? "root" : C(n.get(i) ?? {});
  return !!eo(a, r);
}
function Ze(c, t, e) {
  if (t === e) return !1;
  const i = new Map(c.map((a) => [a.id, a]));
  let n = i.get(e);
  const o = /* @__PURE__ */ new Set();
  for (; n != null && n.parent_id; ) {
    if (n.parent_id === t || o.has(n.parent_id)) return !0;
    o.add(n.parent_id), n = i.get(n.parent_id);
  }
  return !1;
}
const no = "managed_shadow", oo = /* @__PURE__ */ new Set(["floor", "building", "grounds", "property"]), Zt = (c) => {
  var t;
  return ((t = c == null ? void 0 : c.modules) == null ? void 0 : t._meta) || {};
}, Jt = (c, t) => {
  const e = c[t];
  return typeof e == "string" ? e.trim() : "";
}, ao = (c) => Jt(Zt(c), "role").toLowerCase(), ro = (c) => Jt(Zt(c), "type").toLowerCase(), Re = (c = []) => {
  const t = /* @__PURE__ */ new Set();
  for (const e of c) {
    const i = Zt(e), n = Jt(i, "shadow_area_id");
    n && oo.has(ro(e)) && t.add(n);
  }
  return t;
}, De = (c, t) => {
  if (!c) return !1;
  if (t != null && t.has(c.id))
    return !0;
  const e = Zt(c);
  return !!(ao(c) === no || Jt(e, "shadow_for_location_id"));
}, de = (c) => {
  if (!c) return "";
  const t = Zt(c);
  return Jt(t, "shadow_area_id");
};
function Je(c, t) {
  if (!c) return "";
  if (c.is_explicit_root) return c.id;
  const e = C(c);
  if (!(e === "floor" || e === "building" || e === "grounds" || e === "property")) return c.id;
  const n = de(c);
  return !n || !(t || []).find((r) => r.id === n) ? c.id : n;
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const so = { CHILD: 2 }, co = (c) => (...t) => ({ _$litDirective$: c, values: t });
class lo {
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
const { I: uo } = Qn, Li = () => document.createComment(""), Mt = (c, t, e) => {
  var o;
  const i = c._$AA.parentNode, n = t === void 0 ? c._$AB : t._$AA;
  if (e === void 0) {
    const a = i.insertBefore(Li(), n), r = i.insertBefore(Li(), n);
    e = new uo(a, r, c, c.options);
  } else {
    const a = e._$AB.nextSibling, r = e._$AM, s = r !== c;
    if (s) {
      let l;
      (o = e._$AQ) == null || o.call(e, c), e._$AM = c, e._$AP !== void 0 && (l = c._$AU) !== r._$AU && e._$AP(l);
    }
    if (a !== n || s) {
      let l = e._$AA;
      for (; l !== a; ) {
        const d = l.nextSibling;
        i.insertBefore(l, n), l = d;
      }
    }
  }
  return e;
}, _t = (c, t, e = c) => (c._$AI(t, e), c), ho = {}, po = (c, t = ho) => c._$AH = t, go = (c) => c._$AH, ze = (c) => {
  c._$AR(), c._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ii = (c, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let n = t; n <= e; n++) i.set(c[n], n);
  return i;
}, ue = co(class extends lo {
  constructor(c) {
    if (super(c), c.type !== so.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(c, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const n = [], o = [];
    let a = 0;
    for (const r of c) n[a] = i ? i(r, a) : a, o[a] = e(r, a), a++;
    return { values: o, keys: n };
  }
  render(c, t, e) {
    return this.dt(c, t, e).values;
  }
  update(c, [t, e, i]) {
    const n = go(c), { values: o, keys: a } = this.dt(t, e, i);
    if (!Array.isArray(n)) return this.ut = a, o;
    const r = this.ut ?? (this.ut = []), s = [];
    let l, d, u = 0, p = n.length - 1, _ = 0, h = o.length - 1;
    for (; u <= p && _ <= h; ) if (n[u] === null) u++;
    else if (n[p] === null) p--;
    else if (r[u] === a[_]) s[_] = _t(n[u], o[_]), u++, _++;
    else if (r[p] === a[h]) s[h] = _t(n[p], o[h]), p--, h--;
    else if (r[u] === a[h]) s[h] = _t(n[u], o[h]), Mt(c, s[h + 1], n[u]), u++, h--;
    else if (r[p] === a[_]) s[_] = _t(n[p], o[_]), Mt(c, n[u], n[p]), p--, _++;
    else if (l === void 0 && (l = Ii(a, _, h), d = Ii(r, u, p)), l.has(r[u])) if (l.has(r[p])) {
      const f = d.get(a[_]), m = f !== void 0 ? n[f] : null;
      if (m === null) {
        const v = Mt(c, n[u]);
        _t(v, o[_]), s[_] = v;
      } else s[_] = _t(m, o[_]), Mt(c, n[u], m), n[f] = null;
      _++;
    } else ze(n[p]), p--;
    else ze(n[u]), u++;
    for (; _ <= h; ) {
      const f = Mt(c, s[h + 1]);
      _t(f, o[_]), s[_++] = f;
    }
    for (; u <= p; ) {
      const f = n[u++];
      f !== null && ze(f);
    }
    return this.ut = a, po(c, s), St;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function Oi(c, t) {
  var e = Object.keys(c);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(c);
    t && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(c, n).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function et(c) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Oi(Object(e), !0).forEach(function(i) {
      fo(c, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(c, Object.getOwnPropertyDescriptors(e)) : Oi(Object(e)).forEach(function(i) {
      Object.defineProperty(c, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return c;
}
function he(c) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? he = function(t) {
    return typeof t;
  } : he = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, he(c);
}
function fo(c, t, e) {
  return t in c ? Object.defineProperty(c, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : c[t] = e, c;
}
function rt() {
  return rt = Object.assign || function(c) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (c[i] = e[i]);
    }
    return c;
  }, rt.apply(this, arguments);
}
function _o(c, t) {
  if (c == null) return {};
  var e = {}, i = Object.keys(c), n, o;
  for (o = 0; o < i.length; o++)
    n = i[o], !(t.indexOf(n) >= 0) && (e[n] = c[n]);
  return e;
}
function mo(c, t) {
  if (c == null) return {};
  var e = _o(c, t), i, n;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(c);
    for (n = 0; n < o.length; n++)
      i = o[n], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(c, i) && (e[i] = c[i]);
  }
  return e;
}
var yo = "1.15.6";
function at(c) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(c);
}
var st = at(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), te = at(/Edge/i), Pi = at(/firefox/i), Wt = at(/safari/i) && !at(/chrome/i) && !at(/android/i), fi = at(/iP(ad|od|hone)/i), un = at(/chrome/i) && at(/android/i), hn = {
  capture: !1,
  passive: !1
};
function T(c, t, e) {
  c.addEventListener(t, e, !st && hn);
}
function A(c, t, e) {
  c.removeEventListener(t, e, !st && hn);
}
function ye(c, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), c)
      try {
        if (c.matches)
          return c.matches(t);
        if (c.msMatchesSelector)
          return c.msMatchesSelector(t);
        if (c.webkitMatchesSelector)
          return c.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function pn(c) {
  return c.host && c !== document && c.host.nodeType ? c.host : c.parentNode;
}
function Z(c, t, e, i) {
  if (c) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? c.parentNode === e && ye(c, t) : ye(c, t)) || i && c === e)
        return c;
      if (c === e) break;
    } while (c = pn(c));
  }
  return null;
}
var zi = /\s+/g;
function q(c, t, e) {
  if (c && t)
    if (c.classList)
      c.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + c.className + " ").replace(zi, " ").replace(" " + t + " ", " ");
      c.className = (i + (e ? " " + t : "")).replace(zi, " ");
    }
}
function x(c, t, e) {
  var i = c && c.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(c, "") : c.currentStyle && (e = c.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Rt(c, t) {
  var e = "";
  if (typeof c == "string")
    e = c;
  else
    do {
      var i = x(c, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (c = c.parentNode));
  var n = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return n && new n(e);
}
function gn(c, t, e) {
  if (c) {
    var i = c.getElementsByTagName(t), n = 0, o = i.length;
    if (e)
      for (; n < o; n++)
        e(i[n], n);
    return i;
  }
  return [];
}
function tt() {
  var c = document.scrollingElement;
  return c || document.documentElement;
}
function z(c, t, e, i, n) {
  if (!(!c.getBoundingClientRect && c !== window)) {
    var o, a, r, s, l, d, u;
    if (c !== window && c.parentNode && c !== tt() ? (o = c.getBoundingClientRect(), a = o.top, r = o.left, s = o.bottom, l = o.right, d = o.height, u = o.width) : (a = 0, r = 0, s = window.innerHeight, l = window.innerWidth, d = window.innerHeight, u = window.innerWidth), (t || e) && c !== window && (n = n || c.parentNode, !st))
      do
        if (n && n.getBoundingClientRect && (x(n, "transform") !== "none" || e && x(n, "position") !== "static")) {
          var p = n.getBoundingClientRect();
          a -= p.top + parseInt(x(n, "border-top-width")), r -= p.left + parseInt(x(n, "border-left-width")), s = a + o.height, l = r + o.width;
          break;
        }
      while (n = n.parentNode);
    if (i && c !== window) {
      var _ = Rt(n || c), h = _ && _.a, f = _ && _.d;
      _ && (a /= f, r /= h, u /= h, d /= f, s = a + d, l = r + u);
    }
    return {
      top: a,
      left: r,
      bottom: s,
      right: l,
      width: u,
      height: d
    };
  }
}
function Mi(c, t, e) {
  for (var i = pt(c, !0), n = z(c)[t]; i; ) {
    var o = z(i)[e], a = void 0;
    if (a = n >= o, !a) return i;
    if (i === tt()) break;
    i = pt(i, !1);
  }
  return !1;
}
function Ct(c, t, e, i) {
  for (var n = 0, o = 0, a = c.children; o < a.length; ) {
    if (a[o].style.display !== "none" && a[o] !== w.ghost && (i || a[o] !== w.dragged) && Z(a[o], e.draggable, c, !1)) {
      if (n === t)
        return a[o];
      n++;
    }
    o++;
  }
  return null;
}
function _i(c, t) {
  for (var e = c.lastElementChild; e && (e === w.ghost || x(e, "display") === "none" || t && !ye(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function Y(c, t) {
  var e = 0;
  if (!c || !c.parentNode)
    return -1;
  for (; c = c.previousElementSibling; )
    c.nodeName.toUpperCase() !== "TEMPLATE" && c !== w.clone && (!t || ye(c, t)) && e++;
  return e;
}
function Fi(c) {
  var t = 0, e = 0, i = tt();
  if (c)
    do {
      var n = Rt(c), o = n.a, a = n.d;
      t += c.scrollLeft * o, e += c.scrollTop * a;
    } while (c !== i && (c = c.parentNode));
  return [t, e];
}
function vo(c, t) {
  for (var e in c)
    if (c.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === c[e][i]) return Number(e);
    }
  return -1;
}
function pt(c, t) {
  if (!c || !c.getBoundingClientRect) return tt();
  var e = c, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var n = x(e);
      if (e.clientWidth < e.scrollWidth && (n.overflowX == "auto" || n.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (n.overflowY == "auto" || n.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return tt();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return tt();
}
function bo(c, t) {
  if (c && t)
    for (var e in t)
      t.hasOwnProperty(e) && (c[e] = t[e]);
  return c;
}
function Me(c, t) {
  return Math.round(c.top) === Math.round(t.top) && Math.round(c.left) === Math.round(t.left) && Math.round(c.height) === Math.round(t.height) && Math.round(c.width) === Math.round(t.width);
}
var Vt;
function fn(c, t) {
  return function() {
    if (!Vt) {
      var e = arguments, i = this;
      e.length === 1 ? c.call(i, e[0]) : c.apply(i, e), Vt = setTimeout(function() {
        Vt = void 0;
      }, t);
    }
  };
}
function xo() {
  clearTimeout(Vt), Vt = void 0;
}
function _n(c, t, e) {
  c.scrollLeft += t, c.scrollTop += e;
}
function mn(c) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(c).cloneNode(!0) : e ? e(c).clone(!0)[0] : c.cloneNode(!0);
}
function yn(c, t, e) {
  var i = {};
  return Array.from(c.children).forEach(function(n) {
    var o, a, r, s;
    if (!(!Z(n, t.draggable, c, !1) || n.animated || n === e)) {
      var l = z(n);
      i.left = Math.min((o = i.left) !== null && o !== void 0 ? o : 1 / 0, l.left), i.top = Math.min((a = i.top) !== null && a !== void 0 ? a : 1 / 0, l.top), i.right = Math.max((r = i.right) !== null && r !== void 0 ? r : -1 / 0, l.right), i.bottom = Math.max((s = i.bottom) !== null && s !== void 0 ? s : -1 / 0, l.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var V = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function wo() {
  var c = [], t;
  return {
    captureAnimationState: function() {
      if (c = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(n) {
          if (!(x(n, "display") === "none" || n === w.ghost)) {
            c.push({
              target: n,
              rect: z(n)
            });
            var o = et({}, c[c.length - 1].rect);
            if (n.thisAnimationDuration) {
              var a = Rt(n, !0);
              a && (o.top -= a.f, o.left -= a.e);
            }
            n.fromRect = o;
          }
        });
      }
    },
    addAnimationState: function(i) {
      c.push(i);
    },
    removeAnimationState: function(i) {
      c.splice(vo(c, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var n = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var o = !1, a = 0;
      c.forEach(function(r) {
        var s = 0, l = r.target, d = l.fromRect, u = z(l), p = l.prevFromRect, _ = l.prevToRect, h = r.rect, f = Rt(l, !0);
        f && (u.top -= f.f, u.left -= f.e), l.toRect = u, l.thisAnimationDuration && Me(p, u) && !Me(d, u) && // Make sure animatingRect is on line between toRect & fromRect
        (h.top - u.top) / (h.left - u.left) === (d.top - u.top) / (d.left - u.left) && (s = $o(h, p, _, n.options)), Me(u, d) || (l.prevFromRect = d, l.prevToRect = u, s || (s = n.options.animation), n.animate(l, h, u, s)), s && (o = !0, a = Math.max(a, s), clearTimeout(l.animationResetTimer), l.animationResetTimer = setTimeout(function() {
          l.animationTime = 0, l.prevFromRect = null, l.fromRect = null, l.prevToRect = null, l.thisAnimationDuration = null;
        }, s), l.thisAnimationDuration = s);
      }), clearTimeout(t), o ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, a) : typeof i == "function" && i(), c = [];
    },
    animate: function(i, n, o, a) {
      if (a) {
        x(i, "transition", ""), x(i, "transform", "");
        var r = Rt(this.el), s = r && r.a, l = r && r.d, d = (n.left - o.left) / (s || 1), u = (n.top - o.top) / (l || 1);
        i.animatingX = !!d, i.animatingY = !!u, x(i, "transform", "translate3d(" + d + "px," + u + "px,0)"), this.forRepaintDummy = So(i), x(i, "transition", "transform " + a + "ms" + (this.options.easing ? " " + this.options.easing : "")), x(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          x(i, "transition", ""), x(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, a);
      }
    }
  };
}
function So(c) {
  return c.offsetWidth;
}
function $o(c, t, e, i) {
  return Math.sqrt(Math.pow(t.top - c.top, 2) + Math.pow(t.left - c.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var $t = [], Fe = {
  initializeByDefault: !0
}, ee = {
  mount: function(t) {
    for (var e in Fe)
      Fe.hasOwnProperty(e) && !(e in t) && (t[e] = Fe[e]);
    $t.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), $t.push(t);
  },
  pluginEvent: function(t, e, i) {
    var n = this;
    this.eventCanceled = !1, i.cancel = function() {
      n.eventCanceled = !0;
    };
    var o = t + "Global";
    $t.forEach(function(a) {
      e[a.pluginName] && (e[a.pluginName][o] && e[a.pluginName][o](et({
        sortable: e
      }, i)), e.options[a.pluginName] && e[a.pluginName][t] && e[a.pluginName][t](et({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, n) {
    $t.forEach(function(r) {
      var s = r.pluginName;
      if (!(!t.options[s] && !r.initializeByDefault)) {
        var l = new r(t, e, t.options);
        l.sortable = t, l.options = t.options, t[s] = l, rt(i, l.defaults);
      }
    });
    for (var o in t.options)
      if (t.options.hasOwnProperty(o)) {
        var a = this.modifyOption(t, o, t.options[o]);
        typeof a < "u" && (t.options[o] = a);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return $t.forEach(function(n) {
      typeof n.eventProperties == "function" && rt(i, n.eventProperties.call(e[n.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var n;
    return $t.forEach(function(o) {
      t[o.pluginName] && o.optionListeners && typeof o.optionListeners[e] == "function" && (n = o.optionListeners[e].call(t[o.pluginName], i));
    }), n;
  }
};
function ko(c) {
  var t = c.sortable, e = c.rootEl, i = c.name, n = c.targetEl, o = c.cloneEl, a = c.toEl, r = c.fromEl, s = c.oldIndex, l = c.newIndex, d = c.oldDraggableIndex, u = c.newDraggableIndex, p = c.originalEvent, _ = c.putSortable, h = c.extraEventProperties;
  if (t = t || e && e[V], !!t) {
    var f, m = t.options, v = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !st && !te ? f = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (f = document.createEvent("Event"), f.initEvent(i, !0, !0)), f.to = a || e, f.from = r || e, f.item = n || e, f.clone = o, f.oldIndex = s, f.newIndex = l, f.oldDraggableIndex = d, f.newDraggableIndex = u, f.originalEvent = p, f.pullMode = _ ? _.lastPutMode : void 0;
    var $ = et(et({}, h), ee.getEventProperties(i, t));
    for (var k in $)
      f[k] = $[k];
    e && e.dispatchEvent(f), m[v] && m[v].call(t, f);
  }
}
var Ao = ["evt"], W = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, n = i.evt, o = mo(i, Ao);
  ee.pluginEvent.bind(w)(t, e, et({
    dragEl: y,
    parentEl: O,
    ghostEl: S,
    rootEl: L,
    nextEl: vt,
    lastDownEl: pe,
    cloneEl: I,
    cloneHidden: ut,
    dragStarted: Ft,
    putSortable: B,
    activeSortable: w.active,
    originalEvent: n,
    oldIndex: Et,
    oldDraggableIndex: Ht,
    newIndex: G,
    newDraggableIndex: lt,
    hideGhostForTarget: wn,
    unhideGhostForTarget: Sn,
    cloneNowHidden: function() {
      ut = !0;
    },
    cloneNowShown: function() {
      ut = !1;
    },
    dispatchSortableEvent: function(r) {
      U({
        sortable: e,
        name: r,
        originalEvent: n
      });
    }
  }, o));
};
function U(c) {
  ko(et({
    putSortable: B,
    cloneEl: I,
    targetEl: y,
    rootEl: L,
    oldIndex: Et,
    oldDraggableIndex: Ht,
    newIndex: G,
    newDraggableIndex: lt
  }, c));
}
var y, O, S, L, vt, pe, I, ut, Et, G, Ht, lt, ne, B, Tt = !1, ve = !1, be = [], mt, Q, Ne, Be, Ni, Bi, Ft, kt, qt, Gt = !1, oe = !1, ge, j, je = [], ti = !1, xe = [], Ce = typeof document < "u", ae = fi, ji = te || st ? "cssFloat" : "float", To = Ce && !un && !fi && "draggable" in document.createElement("div"), vn = function() {
  if (Ce) {
    if (st)
      return !1;
    var c = document.createElement("x");
    return c.style.cssText = "pointer-events:auto", c.style.pointerEvents === "auto";
  }
}(), bn = function(t, e) {
  var i = x(t), n = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), o = Ct(t, 0, e), a = Ct(t, 1, e), r = o && x(o), s = a && x(a), l = r && parseInt(r.marginLeft) + parseInt(r.marginRight) + z(o).width, d = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + z(a).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (o && r.float && r.float !== "none") {
    var u = r.float === "left" ? "left" : "right";
    return a && (s.clear === "both" || s.clear === u) ? "vertical" : "horizontal";
  }
  return o && (r.display === "block" || r.display === "flex" || r.display === "table" || r.display === "grid" || l >= n && i[ji] === "none" || a && i[ji] === "none" && l + d > n) ? "vertical" : "horizontal";
}, Eo = function(t, e, i) {
  var n = i ? t.left : t.top, o = i ? t.right : t.bottom, a = i ? t.width : t.height, r = i ? e.left : e.top, s = i ? e.right : e.bottom, l = i ? e.width : e.height;
  return n === r || o === s || n + a / 2 === r + l / 2;
}, Ro = function(t, e) {
  var i;
  return be.some(function(n) {
    var o = n[V].options.emptyInsertThreshold;
    if (!(!o || _i(n))) {
      var a = z(n), r = t >= a.left - o && t <= a.right + o, s = e >= a.top - o && e <= a.bottom + o;
      if (r && s)
        return i = n;
    }
  }), i;
}, xn = function(t) {
  function e(o, a) {
    return function(r, s, l, d) {
      var u = r.options.group.name && s.options.group.name && r.options.group.name === s.options.group.name;
      if (o == null && (a || u))
        return !0;
      if (o == null || o === !1)
        return !1;
      if (a && o === "clone")
        return o;
      if (typeof o == "function")
        return e(o(r, s, l, d), a)(r, s, l, d);
      var p = (a ? r : s).options.group.name;
      return o === !0 || typeof o == "string" && o === p || o.join && o.indexOf(p) > -1;
    };
  }
  var i = {}, n = t.group;
  (!n || he(n) != "object") && (n = {
    name: n
  }), i.name = n.name, i.checkPull = e(n.pull, !0), i.checkPut = e(n.put), i.revertClone = n.revertClone, t.group = i;
}, wn = function() {
  !vn && S && x(S, "display", "none");
}, Sn = function() {
  !vn && S && x(S, "display", "");
};
Ce && !un && document.addEventListener("click", function(c) {
  if (ve)
    return c.preventDefault(), c.stopPropagation && c.stopPropagation(), c.stopImmediatePropagation && c.stopImmediatePropagation(), ve = !1, !1;
}, !0);
var yt = function(t) {
  if (y) {
    t = t.touches ? t.touches[0] : t;
    var e = Ro(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var n in t)
        t.hasOwnProperty(n) && (i[n] = t[n]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[V]._onDragOver(i);
    }
  }
}, Do = function(t) {
  y && y.parentNode[V]._isOutsideThisEl(t.target);
};
function w(c, t) {
  if (!(c && c.nodeType && c.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(c));
  this.el = c, this.options = t = rt({}, t), c[V] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(c.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return bn(c, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(a, r) {
      a.setData("Text", r.textContent);
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
    supportPointer: w.supportPointer !== !1 && "PointerEvent" in window && (!Wt || fi),
    emptyInsertThreshold: 5
  };
  ee.initializePlugins(this, c, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  xn(t);
  for (var n in this)
    n.charAt(0) === "_" && typeof this[n] == "function" && (this[n] = this[n].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : To, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? T(c, "pointerdown", this._onTapStart) : (T(c, "mousedown", this._onTapStart), T(c, "touchstart", this._onTapStart)), this.nativeDraggable && (T(c, "dragover", this), T(c, "dragenter", this)), be.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), rt(this, wo());
}
w.prototype = /** @lends Sortable.prototype */
{
  constructor: w,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (kt = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, y) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, n = this.options, o = n.preventOnFilter, a = t.type, r = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, s = (r || t).target, l = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || s, d = n.filter;
      if (Fo(i), !y && !(/mousedown|pointerdown/.test(a) && t.button !== 0 || n.disabled) && !l.isContentEditable && !(!this.nativeDraggable && Wt && s && s.tagName.toUpperCase() === "SELECT") && (s = Z(s, n.draggable, i, !1), !(s && s.animated) && pe !== s)) {
        if (Et = Y(s), Ht = Y(s, n.draggable), typeof d == "function") {
          if (d.call(this, t, s, this)) {
            U({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: s,
              toEl: i,
              fromEl: i
            }), W("filter", e, {
              evt: t
            }), o && t.preventDefault();
            return;
          }
        } else if (d && (d = d.split(",").some(function(u) {
          if (u = Z(l, u.trim(), i, !1), u)
            return U({
              sortable: e,
              rootEl: u,
              name: "filter",
              targetEl: s,
              fromEl: i,
              toEl: i
            }), W("filter", e, {
              evt: t
            }), !0;
        }), d)) {
          o && t.preventDefault();
          return;
        }
        n.handle && !Z(l, n.handle, i, !1) || this._prepareDragStart(t, r, s);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var n = this, o = n.el, a = n.options, r = o.ownerDocument, s;
    if (i && !y && i.parentNode === o) {
      var l = z(i);
      if (L = o, y = i, O = y.parentNode, vt = y.nextSibling, pe = i, ne = a.group, w.dragged = y, mt = {
        target: y,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, Ni = mt.clientX - l.left, Bi = mt.clientY - l.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, y.style["will-change"] = "all", s = function() {
        if (W("delayEnded", n, {
          evt: t
        }), w.eventCanceled) {
          n._onDrop();
          return;
        }
        n._disableDelayedDragEvents(), !Pi && n.nativeDraggable && (y.draggable = !0), n._triggerDragStart(t, e), U({
          sortable: n,
          name: "choose",
          originalEvent: t
        }), q(y, a.chosenClass, !0);
      }, a.ignore.split(",").forEach(function(d) {
        gn(y, d.trim(), Ue);
      }), T(r, "dragover", yt), T(r, "mousemove", yt), T(r, "touchmove", yt), a.supportPointer ? (T(r, "pointerup", n._onDrop), !this.nativeDraggable && T(r, "pointercancel", n._onDrop)) : (T(r, "mouseup", n._onDrop), T(r, "touchend", n._onDrop), T(r, "touchcancel", n._onDrop)), Pi && this.nativeDraggable && (this.options.touchStartThreshold = 4, y.draggable = !0), W("delayStart", this, {
        evt: t
      }), a.delay && (!a.delayOnTouchOnly || e) && (!this.nativeDraggable || !(te || st))) {
        if (w.eventCanceled) {
          this._onDrop();
          return;
        }
        a.supportPointer ? (T(r, "pointerup", n._disableDelayedDrag), T(r, "pointercancel", n._disableDelayedDrag)) : (T(r, "mouseup", n._disableDelayedDrag), T(r, "touchend", n._disableDelayedDrag), T(r, "touchcancel", n._disableDelayedDrag)), T(r, "mousemove", n._delayedDragTouchMoveHandler), T(r, "touchmove", n._delayedDragTouchMoveHandler), a.supportPointer && T(r, "pointermove", n._delayedDragTouchMoveHandler), n._dragStartTimer = setTimeout(s, a.delay);
      } else
        s();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    y && Ue(y), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    A(t, "mouseup", this._disableDelayedDrag), A(t, "touchend", this._disableDelayedDrag), A(t, "touchcancel", this._disableDelayedDrag), A(t, "pointerup", this._disableDelayedDrag), A(t, "pointercancel", this._disableDelayedDrag), A(t, "mousemove", this._delayedDragTouchMoveHandler), A(t, "touchmove", this._delayedDragTouchMoveHandler), A(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? T(document, "pointermove", this._onTouchMove) : e ? T(document, "touchmove", this._onTouchMove) : T(document, "mousemove", this._onTouchMove) : (T(y, "dragend", this), T(L, "dragstart", this._onDragStart));
    try {
      document.selection ? fe(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (Tt = !1, L && y) {
      W("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && T(document, "dragover", Do);
      var i = this.options;
      !t && q(y, i.dragClass, !1), q(y, i.ghostClass, !0), w.active = this, t && this._appendGhost(), U({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (Q) {
      this._lastX = Q.clientX, this._lastY = Q.clientY, wn();
      for (var t = document.elementFromPoint(Q.clientX, Q.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(Q.clientX, Q.clientY), t !== e); )
        e = t;
      if (y.parentNode[V]._isOutsideThisEl(t), e)
        do {
          if (e[V]) {
            var i = void 0;
            if (i = e[V]._onDragOver({
              clientX: Q.clientX,
              clientY: Q.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = pn(e));
      Sn();
    }
  },
  _onTouchMove: function(t) {
    if (mt) {
      var e = this.options, i = e.fallbackTolerance, n = e.fallbackOffset, o = t.touches ? t.touches[0] : t, a = S && Rt(S, !0), r = S && a && a.a, s = S && a && a.d, l = ae && j && Fi(j), d = (o.clientX - mt.clientX + n.x) / (r || 1) + (l ? l[0] - je[0] : 0) / (r || 1), u = (o.clientY - mt.clientY + n.y) / (s || 1) + (l ? l[1] - je[1] : 0) / (s || 1);
      if (!w.active && !Tt) {
        if (i && Math.max(Math.abs(o.clientX - this._lastX), Math.abs(o.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (S) {
        a ? (a.e += d - (Ne || 0), a.f += u - (Be || 0)) : a = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: d,
          f: u
        };
        var p = "matrix(".concat(a.a, ",").concat(a.b, ",").concat(a.c, ",").concat(a.d, ",").concat(a.e, ",").concat(a.f, ")");
        x(S, "webkitTransform", p), x(S, "mozTransform", p), x(S, "msTransform", p), x(S, "transform", p), Ne = d, Be = u, Q = o;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!S) {
      var t = this.options.fallbackOnBody ? document.body : L, e = z(y, !0, ae, !0, t), i = this.options;
      if (ae) {
        for (j = t; x(j, "position") === "static" && x(j, "transform") === "none" && j !== document; )
          j = j.parentNode;
        j !== document.body && j !== document.documentElement ? (j === document && (j = tt()), e.top += j.scrollTop, e.left += j.scrollLeft) : j = tt(), je = Fi(j);
      }
      S = y.cloneNode(!0), q(S, i.ghostClass, !1), q(S, i.fallbackClass, !0), q(S, i.dragClass, !0), x(S, "transition", ""), x(S, "transform", ""), x(S, "box-sizing", "border-box"), x(S, "margin", 0), x(S, "top", e.top), x(S, "left", e.left), x(S, "width", e.width), x(S, "height", e.height), x(S, "opacity", "0.8"), x(S, "position", ae ? "absolute" : "fixed"), x(S, "zIndex", "100000"), x(S, "pointerEvents", "none"), w.ghost = S, t.appendChild(S), x(S, "transform-origin", Ni / parseInt(S.style.width) * 100 + "% " + Bi / parseInt(S.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, n = t.dataTransfer, o = i.options;
    if (W("dragStart", this, {
      evt: t
    }), w.eventCanceled) {
      this._onDrop();
      return;
    }
    W("setupClone", this), w.eventCanceled || (I = mn(y), I.removeAttribute("id"), I.draggable = !1, I.style["will-change"] = "", this._hideClone(), q(I, this.options.chosenClass, !1), w.clone = I), i.cloneId = fe(function() {
      W("clone", i), !w.eventCanceled && (i.options.removeCloneOnHide || L.insertBefore(I, y), i._hideClone(), U({
        sortable: i,
        name: "clone"
      }));
    }), !e && q(y, o.dragClass, !0), e ? (ve = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (A(document, "mouseup", i._onDrop), A(document, "touchend", i._onDrop), A(document, "touchcancel", i._onDrop), n && (n.effectAllowed = "move", o.setData && o.setData.call(i, n, y)), T(document, "drop", i), x(y, "transform", "translateZ(0)")), Tt = !0, i._dragStartId = fe(i._dragStarted.bind(i, e, t)), T(document, "selectstart", i), Ft = !0, window.getSelection().removeAllRanges(), Wt && x(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, n, o, a, r = this.options, s = r.group, l = w.active, d = ne === s, u = r.sort, p = B || l, _, h = this, f = !1;
    if (ti) return;
    function m(Pt, Cn) {
      W(Pt, h, et({
        evt: t,
        isOwner: d,
        axis: _ ? "vertical" : "horizontal",
        revert: a,
        dragRect: n,
        targetRect: o,
        canSort: u,
        fromSortable: p,
        target: i,
        completed: $,
        onMove: function(xi, Ln) {
          return re(L, e, y, n, xi, z(xi), t, Ln);
        },
        changed: k
      }, Cn));
    }
    function v() {
      m("dragOverAnimationCapture"), h.captureAnimationState(), h !== p && p.captureAnimationState();
    }
    function $(Pt) {
      return m("dragOverCompleted", {
        insertion: Pt
      }), Pt && (d ? l._hideClone() : l._showClone(h), h !== p && (q(y, B ? B.options.ghostClass : l.options.ghostClass, !1), q(y, r.ghostClass, !0)), B !== h && h !== w.active ? B = h : h === w.active && B && (B = null), p === h && (h._ignoreWhileAnimating = i), h.animateAll(function() {
        m("dragOverAnimationComplete"), h._ignoreWhileAnimating = null;
      }), h !== p && (p.animateAll(), p._ignoreWhileAnimating = null)), (i === y && !y.animated || i === e && !i.animated) && (kt = null), !r.dragoverBubble && !t.rootEl && i !== document && (y.parentNode[V]._isOutsideThisEl(t.target), !Pt && yt(t)), !r.dragoverBubble && t.stopPropagation && t.stopPropagation(), f = !0;
    }
    function k() {
      G = Y(y), lt = Y(y, r.draggable), U({
        sortable: h,
        name: "change",
        toEl: e,
        newIndex: G,
        newDraggableIndex: lt,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = Z(i, r.draggable, e, !0), m("dragOver"), w.eventCanceled) return f;
    if (y.contains(t.target) || i.animated && i.animatingX && i.animatingY || h._ignoreWhileAnimating === i)
      return $(!1);
    if (ve = !1, l && !r.disabled && (d ? u || (a = O !== L) : B === this || (this.lastPutMode = ne.checkPull(this, l, y, t)) && s.checkPut(this, l, y, t))) {
      if (_ = this._getDirection(t, i) === "vertical", n = z(y), m("dragOverValid"), w.eventCanceled) return f;
      if (a)
        return O = L, v(), this._hideClone(), m("revert"), w.eventCanceled || (vt ? L.insertBefore(y, vt) : L.appendChild(y)), $(!0);
      var b = _i(e, r.draggable);
      if (!b || Oo(t, _, this) && !b.animated) {
        if (b === y)
          return $(!1);
        if (b && e === t.target && (i = b), i && (o = z(i)), re(L, e, y, n, i, o, t, !!i) !== !1)
          return v(), b && b.nextSibling ? e.insertBefore(y, b.nextSibling) : e.appendChild(y), O = e, k(), $(!0);
      } else if (b && Io(t, _, this)) {
        var M = Ct(e, 0, r, !0);
        if (M === y)
          return $(!1);
        if (i = M, o = z(i), re(L, e, y, n, i, o, t, !1) !== !1)
          return v(), e.insertBefore(y, M), O = e, k(), $(!0);
      } else if (i.parentNode === e) {
        o = z(i);
        var F = 0, D, R = y.parentNode !== e, E = !Eo(y.animated && y.toRect || n, i.animated && i.toRect || o, _), H = _ ? "top" : "left", X = Mi(i, "top", "top") || Mi(y, "top", "top"), it = X ? X.scrollTop : void 0;
        kt !== i && (D = o[H], Gt = !1, oe = !E && r.invertSwap || R), F = Po(t, i, o, _, E ? 1 : r.swapThreshold, r.invertedSwapThreshold == null ? r.swapThreshold : r.invertedSwapThreshold, oe, kt === i);
        var K;
        if (F !== 0) {
          var J = Y(y);
          do
            J -= F, K = O.children[J];
          while (K && (x(K, "display") === "none" || K === S));
        }
        if (F === 0 || K === i)
          return $(!1);
        kt = i, qt = F;
        var nt = i.nextElementSibling, ct = !1;
        ct = F === 1;
        var ie = re(L, e, y, n, i, o, t, ct);
        if (ie !== !1)
          return (ie === 1 || ie === -1) && (ct = ie === 1), ti = !0, setTimeout(Lo, 30), v(), ct && !nt ? e.appendChild(y) : i.parentNode.insertBefore(y, ct ? nt : i), X && _n(X, 0, it - X.scrollTop), O = y.parentNode, D !== void 0 && !oe && (ge = Math.abs(D - z(i)[H])), k(), $(!0);
      }
      if (e.contains(y))
        return $(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    A(document, "mousemove", this._onTouchMove), A(document, "touchmove", this._onTouchMove), A(document, "pointermove", this._onTouchMove), A(document, "dragover", yt), A(document, "mousemove", yt), A(document, "touchmove", yt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    A(t, "mouseup", this._onDrop), A(t, "touchend", this._onDrop), A(t, "pointerup", this._onDrop), A(t, "pointercancel", this._onDrop), A(t, "touchcancel", this._onDrop), A(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (G = Y(y), lt = Y(y, i.draggable), W("drop", this, {
      evt: t
    }), O = y && y.parentNode, G = Y(y), lt = Y(y, i.draggable), w.eventCanceled) {
      this._nulling();
      return;
    }
    Tt = !1, oe = !1, Gt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), ei(this.cloneId), ei(this._dragStartId), this.nativeDraggable && (A(document, "drop", this), A(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Wt && x(document.body, "user-select", ""), x(y, "transform", ""), t && (Ft && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), S && S.parentNode && S.parentNode.removeChild(S), (L === O || B && B.lastPutMode !== "clone") && I && I.parentNode && I.parentNode.removeChild(I), y && (this.nativeDraggable && A(y, "dragend", this), Ue(y), y.style["will-change"] = "", Ft && !Tt && q(y, B ? B.options.ghostClass : this.options.ghostClass, !1), q(y, this.options.chosenClass, !1), U({
      sortable: this,
      name: "unchoose",
      toEl: O,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), L !== O ? (G >= 0 && (U({
      rootEl: O,
      name: "add",
      toEl: O,
      fromEl: L,
      originalEvent: t
    }), U({
      sortable: this,
      name: "remove",
      toEl: O,
      originalEvent: t
    }), U({
      rootEl: O,
      name: "sort",
      toEl: O,
      fromEl: L,
      originalEvent: t
    }), U({
      sortable: this,
      name: "sort",
      toEl: O,
      originalEvent: t
    })), B && B.save()) : G !== Et && G >= 0 && (U({
      sortable: this,
      name: "update",
      toEl: O,
      originalEvent: t
    }), U({
      sortable: this,
      name: "sort",
      toEl: O,
      originalEvent: t
    })), w.active && ((G == null || G === -1) && (G = Et, lt = Ht), U({
      sortable: this,
      name: "end",
      toEl: O,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    W("nulling", this), L = y = O = S = vt = I = pe = ut = mt = Q = Ft = G = lt = Et = Ht = kt = qt = B = ne = w.dragged = w.ghost = w.clone = w.active = null, xe.forEach(function(t) {
      t.checked = !0;
    }), xe.length = Ne = Be = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        y && (this._onDragOver(t), Co(t));
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
    for (var t = [], e, i = this.el.children, n = 0, o = i.length, a = this.options; n < o; n++)
      e = i[n], Z(e, a.draggable, this.el, !1) && t.push(e.getAttribute(a.dataIdAttr) || Mo(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, n = this.el;
    this.toArray().forEach(function(o, a) {
      var r = n.children[a];
      Z(r, this.options.draggable, n, !1) && (i[o] = r);
    }, this), e && this.captureAnimationState(), t.forEach(function(o) {
      i[o] && (n.removeChild(i[o]), n.appendChild(i[o]));
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
    return Z(t, e || this.options.draggable, this.el, !1);
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
    var n = ee.modifyOption(this, t, e);
    typeof n < "u" ? i[t] = n : i[t] = e, t === "group" && xn(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    W("destroy", this);
    var t = this.el;
    t[V] = null, A(t, "mousedown", this._onTapStart), A(t, "touchstart", this._onTapStart), A(t, "pointerdown", this._onTapStart), this.nativeDraggable && (A(t, "dragover", this), A(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), be.splice(be.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!ut) {
      if (W("hideClone", this), w.eventCanceled) return;
      x(I, "display", "none"), this.options.removeCloneOnHide && I.parentNode && I.parentNode.removeChild(I), ut = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (ut) {
      if (W("showClone", this), w.eventCanceled) return;
      y.parentNode == L && !this.options.group.revertClone ? L.insertBefore(I, y) : vt ? L.insertBefore(I, vt) : L.appendChild(I), this.options.group.revertClone && this.animate(y, I), x(I, "display", ""), ut = !1;
    }
  }
};
function Co(c) {
  c.dataTransfer && (c.dataTransfer.dropEffect = "move"), c.cancelable && c.preventDefault();
}
function re(c, t, e, i, n, o, a, r) {
  var s, l = c[V], d = l.options.onMove, u;
  return window.CustomEvent && !st && !te ? s = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (s = document.createEvent("Event"), s.initEvent("move", !0, !0)), s.to = t, s.from = c, s.dragged = e, s.draggedRect = i, s.related = n || t, s.relatedRect = o || z(t), s.willInsertAfter = r, s.originalEvent = a, c.dispatchEvent(s), d && (u = d.call(l, s, a)), u;
}
function Ue(c) {
  c.draggable = !1;
}
function Lo() {
  ti = !1;
}
function Io(c, t, e) {
  var i = z(Ct(e.el, 0, e.options, !0)), n = yn(e.el, e.options, S), o = 10;
  return t ? c.clientX < n.left - o || c.clientY < i.top && c.clientX < i.right : c.clientY < n.top - o || c.clientY < i.bottom && c.clientX < i.left;
}
function Oo(c, t, e) {
  var i = z(_i(e.el, e.options.draggable)), n = yn(e.el, e.options, S), o = 10;
  return t ? c.clientX > n.right + o || c.clientY > i.bottom && c.clientX > i.left : c.clientY > n.bottom + o || c.clientX > i.right && c.clientY > i.top;
}
function Po(c, t, e, i, n, o, a, r) {
  var s = i ? c.clientY : c.clientX, l = i ? e.height : e.width, d = i ? e.top : e.left, u = i ? e.bottom : e.right, p = !1;
  if (!a) {
    if (r && ge < l * n) {
      if (!Gt && (qt === 1 ? s > d + l * o / 2 : s < u - l * o / 2) && (Gt = !0), Gt)
        p = !0;
      else if (qt === 1 ? s < d + ge : s > u - ge)
        return -qt;
    } else if (s > d + l * (1 - n) / 2 && s < u - l * (1 - n) / 2)
      return zo(t);
  }
  return p = p || a, p && (s < d + l * o / 2 || s > u - l * o / 2) ? s > d + l / 2 ? 1 : -1 : 0;
}
function zo(c) {
  return Y(y) < Y(c) ? 1 : -1;
}
function Mo(c) {
  for (var t = c.tagName + c.className + c.src + c.href + c.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function Fo(c) {
  xe.length = 0;
  for (var t = c.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && xe.push(i);
  }
}
function fe(c) {
  return setTimeout(c, 0);
}
function ei(c) {
  return clearTimeout(c);
}
Ce && T(document, "touchmove", function(c) {
  (w.active || Tt) && c.cancelable && c.preventDefault();
});
w.utils = {
  on: T,
  off: A,
  css: x,
  find: gn,
  is: function(t, e) {
    return !!Z(t, e, t, !1);
  },
  extend: bo,
  throttle: fn,
  closest: Z,
  toggleClass: q,
  clone: mn,
  index: Y,
  nextTick: fe,
  cancelNextTick: ei,
  detectDirection: bn,
  getChild: Ct,
  expando: V
};
w.get = function(c) {
  return c[V];
};
w.mount = function() {
  for (var c = arguments.length, t = new Array(c), e = 0; e < c; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (w.utils = et(et({}, w.utils), i.utils)), ee.mount(i);
  });
};
w.create = function(c, t) {
  return new w(c, t);
};
w.version = yo;
var P = [], Nt, ii, ni = !1, We, Ve, we, Bt;
function No() {
  function c() {
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
  return c.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? T(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? T(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? T(document, "touchmove", this._handleFallbackAutoScroll) : T(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? A(document, "dragover", this._handleAutoScroll) : (A(document, "pointermove", this._handleFallbackAutoScroll), A(document, "touchmove", this._handleFallbackAutoScroll), A(document, "mousemove", this._handleFallbackAutoScroll)), Ui(), _e(), xo();
    },
    nulling: function() {
      we = ii = Nt = ni = Bt = We = Ve = null, P.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var n = this, o = (e.touches ? e.touches[0] : e).clientX, a = (e.touches ? e.touches[0] : e).clientY, r = document.elementFromPoint(o, a);
      if (we = e, i || this.options.forceAutoScrollFallback || te || st || Wt) {
        He(e, this.options, r, i);
        var s = pt(r, !0);
        ni && (!Bt || o !== We || a !== Ve) && (Bt && Ui(), Bt = setInterval(function() {
          var l = pt(document.elementFromPoint(o, a), !0);
          l !== s && (s = l, _e()), He(e, n.options, l, i);
        }, 10), We = o, Ve = a);
      } else {
        if (!this.options.bubbleScroll || pt(r, !0) === tt()) {
          _e();
          return;
        }
        He(e, this.options, pt(r, !1), !1);
      }
    }
  }, rt(c, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function _e() {
  P.forEach(function(c) {
    clearInterval(c.pid);
  }), P = [];
}
function Ui() {
  clearInterval(Bt);
}
var He = fn(function(c, t, e, i) {
  if (t.scroll) {
    var n = (c.touches ? c.touches[0] : c).clientX, o = (c.touches ? c.touches[0] : c).clientY, a = t.scrollSensitivity, r = t.scrollSpeed, s = tt(), l = !1, d;
    ii !== e && (ii = e, _e(), Nt = t.scroll, d = t.scrollFn, Nt === !0 && (Nt = pt(e, !0)));
    var u = 0, p = Nt;
    do {
      var _ = p, h = z(_), f = h.top, m = h.bottom, v = h.left, $ = h.right, k = h.width, b = h.height, M = void 0, F = void 0, D = _.scrollWidth, R = _.scrollHeight, E = x(_), H = _.scrollLeft, X = _.scrollTop;
      _ === s ? (M = k < D && (E.overflowX === "auto" || E.overflowX === "scroll" || E.overflowX === "visible"), F = b < R && (E.overflowY === "auto" || E.overflowY === "scroll" || E.overflowY === "visible")) : (M = k < D && (E.overflowX === "auto" || E.overflowX === "scroll"), F = b < R && (E.overflowY === "auto" || E.overflowY === "scroll"));
      var it = M && (Math.abs($ - n) <= a && H + k < D) - (Math.abs(v - n) <= a && !!H), K = F && (Math.abs(m - o) <= a && X + b < R) - (Math.abs(f - o) <= a && !!X);
      if (!P[u])
        for (var J = 0; J <= u; J++)
          P[J] || (P[J] = {});
      (P[u].vx != it || P[u].vy != K || P[u].el !== _) && (P[u].el = _, P[u].vx = it, P[u].vy = K, clearInterval(P[u].pid), (it != 0 || K != 0) && (l = !0, P[u].pid = setInterval((function() {
        i && this.layer === 0 && w.active._onTouchMove(we);
        var nt = P[this.layer].vy ? P[this.layer].vy * r : 0, ct = P[this.layer].vx ? P[this.layer].vx * r : 0;
        typeof d == "function" && d.call(w.dragged.parentNode[V], ct, nt, c, we, P[this.layer].el) !== "continue" || _n(P[this.layer].el, ct, nt);
      }).bind({
        layer: u
      }), 24))), u++;
    } while (t.bubbleScroll && p !== s && (p = pt(p, !1)));
    ni = l;
  }
}, 30), $n = function(t) {
  var e = t.originalEvent, i = t.putSortable, n = t.dragEl, o = t.activeSortable, a = t.dispatchSortableEvent, r = t.hideGhostForTarget, s = t.unhideGhostForTarget;
  if (e) {
    var l = i || o;
    r();
    var d = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, u = document.elementFromPoint(d.clientX, d.clientY);
    s(), l && !l.el.contains(u) && (a("spill"), this.onSpill({
      dragEl: n,
      putSortable: i
    }));
  }
};
function mi() {
}
mi.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var n = Ct(this.sortable.el, this.startIndex, this.options);
    n ? this.sortable.el.insertBefore(e, n) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: $n
};
rt(mi, {
  pluginName: "revertOnSpill"
});
function yi() {
}
yi.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, n = i || this.sortable;
    n.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), n.animateAll();
  },
  drop: $n
};
rt(yi, {
  pluginName: "removeOnSpill"
});
w.mount(new No());
w.mount(yi, mi);
function Bo(c) {
  const t = c.toLowerCase(), e = {
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
  for (const [n, o] of Object.entries(e))
    if (o.some((a) => t.includes(a)))
      return i[n] ?? null;
  return null;
}
function jo(c) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius",
    property: "mdi:home-city-outline"
  }[c] ?? "mdi:map-marker";
}
function Uo(c) {
  const t = String(c ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : t === "property" ? "property" : "area";
}
function kn(c) {
  var n;
  const t = (n = c.modules) == null ? void 0 : n._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = Bo(c.name);
  if (e) return e;
  const i = Uo(t == null ? void 0 : t.type);
  return jo(i);
}
const Wo = 24, Vo = 0.18, Ho = 6;
function qo(c, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const n of c) {
      const o = n.location.parent_id;
      o && e.has(o) && !e.has(n.location.id) && (e.add(n.location.id), i = !0);
    }
  }
  return e;
}
function Wi(c, t) {
  const e = new Map(c.map((u) => [u.id, u])), i = /* @__PURE__ */ new Map(), n = (u) => {
    const p = u.parent_id;
    return !p || p === u.id || !e.has(p) ? null : p;
  };
  for (const u of c) {
    const p = n(u);
    i.has(p) || i.set(p, []), i.get(p).push(u);
  }
  const o = [], a = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), l = [...i.get(null) || []];
  for (; l.length; ) {
    const u = l.pop();
    if (!r.has(u.id)) {
      r.add(u.id);
      for (const p of i.get(u.id) || [])
        l.push(p);
    }
  }
  function d(u, p) {
    const _ = i.get(u) || [];
    for (const h of _) {
      if (a.has(h.id)) continue;
      a.add(h.id);
      const m = (i.get(h.id) || []).length > 0, v = t.has(h.id);
      o.push({ location: h, depth: p, hasChildren: m, isExpanded: v }), v && m && d(h.id, p + 1);
    }
  }
  d(null, 0);
  for (const u of c) {
    if (r.has(u.id) || a.has(u.id)) continue;
    a.add(u.id);
    const _ = (i.get(u.id) || []).length > 0, h = t.has(u.id);
    o.push({ location: u, depth: 0, hasChildren: _, isExpanded: h }), h && _ && d(u.id, 1);
  }
  return o;
}
function Vi(c, t, e, i) {
  if (i) {
    const r = c.left;
    if (t >= r && t < r + Wo) return "outdent";
  }
  const n = e - c.top, o = Math.max(c.height, 1), a = Math.min(
    o / 3,
    Math.max(Ho, o * Vo)
  );
  return n < a ? "before" : n >= o - a ? "after" : "inside";
}
function Go(c, t, e, i, n) {
  const o = qo(c, t), a = c.filter((u) => !o.has(u.location.id)), r = a.find((u) => u.location.id === i);
  if (!r) return { parentId: e, siblingIndex: 0 };
  const s = n === "inside" ? i : r.location.parent_id, l = a.filter((u) => u.location.parent_id === s), d = l.findIndex((u) => u.location.id === i);
  return n === "inside" ? { parentId: i, siblingIndex: l.length } : n === "before" ? { parentId: s, siblingIndex: d >= 0 ? d : 0 } : n === "after" ? { parentId: s, siblingIndex: Math.min(d >= 0 ? d + 1 : l.length, l.length) } : { parentId: s, siblingIndex: d >= 0 ? d : 0 };
}
const Hi = "application/x-topomation-entity-id", Se = class Se extends ot {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var a;
    const e = ((a = t.dragged) == null ? void 0 : a.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const n = i.getAttribute("data-id") || void 0;
    if (n && n !== e && !Ze(this.locations, e, n))
      return n;
    let o = i;
    for (; o; ) {
      if (o.classList.contains("tree-item")) {
        const r = o.getAttribute("data-id") || void 0;
        if (r && r !== e && !Ze(this.locations, e, r))
          return r;
      }
      o = t.willInsertAfter ? o.nextElementSibling : o.previousElementSibling;
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
    super.disconnectedCallback(), (t = this._sortable) == null || t.destroy(), this._sortable = void 0, this._boundDragOver = void 0, this._draggedId = void 0, this._entityDropTargetId = void 0;
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
      e && (this._sortable = w.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: (n) => {
          var o;
          this._isDragging = !0, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._draggedId = ((o = n.item) == null ? void 0 : o.getAttribute("data-id")) ?? void 0, this._boundDragOver = this._handleContinuousDragOver.bind(this), e.addEventListener("dragover", this._boundDragOver);
        },
        onMove: (n) => {
          var r;
          const o = ((r = n.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, a = n.related;
          if (o && (a != null && a.classList.contains("tree-item"))) {
            const s = this._resolveRelatedId(n) ?? a.getAttribute("data-id") ?? void 0;
            if (!s || s === o)
              return this._activeDropTarget = void 0, this._dropIndicator = void 0, !0;
            const l = a.getBoundingClientRect(), d = n.originalEvent, u = typeof (d == null ? void 0 : d.clientX) == "number" ? d.clientX : l.left + l.width / 2, p = typeof (d == null ? void 0 : d.clientY) == "number" ? d.clientY : l.top + l.height / 2, _ = this.locations.find((v) => v.id === o), h = (_ == null ? void 0 : _.parent_id) ?? null, m = Vi(l, u, p, s === h);
            this._activeDropTarget = { relatedId: s, zone: m }, this._updateDropIndicator(o, a, m);
          } else
            this._activeDropTarget = void 0, this._dropIndicator = void 0;
          return !0;
        },
        onEnd: (n) => {
          this._isDragging = !1, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._boundDragOver && (e.removeEventListener("dragover", this._boundDragOver), this._boundDragOver = void 0), this._handleDragEnd(n), this._activeDropTarget = void 0, this._draggedId = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    const { item: e } = t, i = e.getAttribute("data-id");
    if (!i) return;
    const n = this.locations.find((u) => u.id === i);
    if (!n) return;
    const o = this._activeDropTarget;
    if (!o) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    const a = Wi(this.locations, this._expandedIds), r = Go(
      a,
      i,
      n.parent_id,
      o.relatedId,
      o.zone
    ), { parentId: s, siblingIndex: l } = r, d = a.filter((u) => u.location.parent_id === n.parent_id).findIndex((u) => u.location.id === i);
    if (s === n.parent_id && l === d) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!io({ locations: this.locations, locationId: i, newParentId: s })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: i, newParentId: s, newIndex: l },
      bubbles: !0,
      composed: !0
    }));
  }
  _handleContinuousDragOver(t) {
    var d, u;
    t.preventDefault();
    const e = this._draggedId;
    if (!e) return;
    const i = (u = (d = t.target) == null ? void 0 : d.closest) == null ? void 0 : u.call(d, ".tree-item");
    if (!i) return;
    const n = i.getAttribute("data-id");
    if (!n || n === e) return;
    const o = i.getBoundingClientRect(), a = this.locations.find((p) => p.id === e), r = (a == null ? void 0 : a.parent_id) ?? null, s = n === r, l = Vi(o, t.clientX, t.clientY, s);
    this._activeDropTarget = { relatedId: n, zone: l }, this._updateDropIndicator(e, i, l);
  }
  _restoreTreeAfterCancelledDrop() {
    this._dropIndicator = void 0, this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _updateDropIndicator(t, e, i) {
    var p;
    const n = (p = this.shadowRoot) == null ? void 0 : p.querySelector(".tree-list");
    if (!e || !n) {
      this._dropIndicator = void 0;
      return;
    }
    const o = n.getBoundingClientRect(), a = e.getBoundingClientRect(), r = i === "inside" ? "child" : i === "outdent" ? "outdent" : "sibling", s = i === "inside" ? "Child" : i === "outdent" ? "Outdent" : i === "after" ? "After" : "Before";
    let l = a.left - o.left + 6;
    i === "inside" && (l += 24), i === "outdent" && (l -= 24), l = Math.max(8, Math.min(l, o.width - 44));
    const d = Math.max(36, o.width - l - 8), u = i === "after" ? a.bottom - o.top : i === "before" ? a.top - o.top : i === "inside" ? a.bottom - o.top : a.top - o.top;
    this._dropIndicator = { top: u, left: l, width: d, intent: r, label: s };
  }
  _cleanupDuplicateTreeItems() {
    var n;
    const t = (n = this.shadowRoot) == null ? void 0 : n.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const o of e) {
      const a = o.getAttribute("data-id");
      if (a) {
        if (i.has(a)) {
          o.remove();
          continue;
        }
        i.add(a);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return g`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? g`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : g`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Wi(this._visibleTreeLocations(), this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return g`
      <div class="tree-list">
        ${ue(
      t,
      (n) => `${this.version}:${n.location.id}:${n.depth}`,
      (n) => this._renderItem(
        n,
        e[n.location.id] || "unknown",
        i[n.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? g`
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
    const { location: n, depth: o, hasChildren: a, isExpanded: r } = t, s = this.selectedId === n.id, l = this._editingId === n.id, d = o * 24, u = C(n), p = n.is_explicit_root ? "root" : u, _ = n.is_explicit_root ? "home root" : u, h = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", f = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", m = ((k = this.occupancyStates) == null ? void 0 : k[n.id]) === !0, v = "mdi:home-switch-outline", $ = m ? "Set vacant" : "Set occupied";
    return g`
      <div
        class="tree-item ${s ? "selected" : ""} ${u === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === n.id ? "entity-drop-target" : ""}"
        data-id=${n.id}
        style="margin-left: ${d}px"
        @click=${(b) => this._handleClick(b, n)}
        @dragover=${(b) => this._handleEntityDragOver(b, n.id)}
        @dragleave=${(b) => this._handleEntityDragLeave(b, n.id)}
        @drop=${(b) => this._handleEntityDrop(b, n.id)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder. Drop on top/middle/bottom of a row for before/child/after." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${r ? "expanded" : ""} ${a ? "" : "hidden"}"
          @click=${(b) => this._handleExpand(b, n.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(n)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${e}"
          title=${this._getOccupancyStatusLabel(e)}
        ></div>

        ${l ? g`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(b) => this._editingValue = b.target.value}
                  @blur=${() => this._finishEditing(n.id)}
                  @keydown=${(b) => this._handleEditKeydown(b, n.id)}
                  @click=${(b) => b.stopPropagation()} />` : g`<div
              class="location-name"
              @dblclick=${this.allowRename ? (b) => this._startEditing(b, n) : () => {
    }}
            >${n.name}</div>`}

        <span class="type-badge ${p}">${_}</span>

        ${n.is_explicit_root || this.readOnly ? "" : g`
              <button
                class="occupancy-btn"
                title=${$}
                @click=${(b) => this._handleOccupancyToggle(b, n, m)}
              >
                <ha-icon .icon=${v}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${f}
                @click=${(b) => this._handleLockToggle(b, n, i)}
              >
                <ha-icon .icon=${h}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((a) => [a.id, a])), i = /* @__PURE__ */ new Map();
    for (const a of this.locations)
      a.parent_id && (i.has(a.parent_id) || i.set(a.parent_id, []), i.get(a.parent_id).push(a.id));
    const n = /* @__PURE__ */ new Map(), o = (a) => {
      var _;
      const r = n.get(a);
      if (r) return r;
      if (!e.has(a)) return "unknown";
      const s = (_ = this.occupancyStates) == null ? void 0 : _[a], l = s === !0 ? "occupied" : s === !1 ? "vacant" : "unknown", d = i.get(a) || [];
      if (!d.length)
        return n.set(a, l), l;
      const u = d.map((h) => o(h));
      let p;
      return l === "occupied" || u.includes("occupied") ? p = "occupied" : l === "vacant" || u.length > 0 && u.every((h) => h === "vacant") ? p = "vacant" : p = "unknown", n.set(a, p), p;
    };
    for (const a of this.locations)
      t[a.id] = o(a.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const n of Object.values(t)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if (o.device_class !== "occupancy") continue;
      const a = o.location_id;
      if (!a) continue;
      const r = o.locked_by;
      e[String(a)] = {
        isLocked: !!o.is_locked,
        lockedBy: Array.isArray(r) ? r.map((s) => String(s)) : []
      };
    }
    return e;
  }
  _visibleTreeLocations() {
    const t = Re(this.locations);
    return this.locations.filter(
      (e) => !this._isManagedShadowLocation(e, t)
    );
  }
  _isManagedShadowLocation(t, e) {
    return De(t, e);
  }
  _getIcon(t) {
    var e, i, n;
    return t.ha_area_id && ((n = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t.ha_area_id]) != null && n.icon) ? this.hass.areas[t.ha_area_id].icon : kn(t);
  }
  _hasEntityDragPayload(t) {
    var i;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.types) || []);
    return e.includes(Hi) ? !0 : !this._isDragging && e.includes("text/plain");
  }
  _readEntityIdFromDrop(t) {
    var n, o;
    const e = (n = t.dataTransfer) == null ? void 0 : n.getData(Hi);
    if (e) return e;
    const i = ((o = t.dataTransfer) == null ? void 0 : o.getData("text/plain")) || "";
    return i.includes(".") ? i : void 0;
  }
  _handleEntityDragOver(t, e) {
    this._hasEntityDragPayload(t) && (t.preventDefault(), t.dataTransfer && (t.dataTransfer.dropEffect = "move"), this._entityDropTargetId = e);
  }
  _handleEntityDragLeave(t, e) {
    var n;
    if (!this._hasEntityDragPayload(t)) return;
    const i = t.relatedTarget;
    (n = i == null ? void 0 : i.closest) != null && n.call(i, `[data-id="${e}"]`) || this._entityDropTargetId === e && (this._entityDropTargetId = void 0);
  }
  _handleEntityDrop(t, e) {
    const i = this._readEntityIdFromDrop(t);
    i && (t.preventDefault(), t.stopPropagation(), this._entityDropTargetId = void 0, this.dispatchEvent(
      new CustomEvent("entity-dropped", {
        detail: { entityId: i, targetLocationId: e },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleClick(t, e) {
    const i = t.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".lock-btn") || i.closest(".occupancy-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: e.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(t, e) {
    t.stopPropagation();
    const i = new Set(this._expandedIds);
    if (i.has(e)) {
      i.delete(e);
      const n = [e], o = /* @__PURE__ */ new Set();
      for (; n.length; ) {
        const a = n.pop();
        if (!o.has(a)) {
          o.add(a);
          for (const r of this.locations)
            r.parent_id === a && (i.delete(r.id), n.push(r.id));
        }
      }
    } else
      i.add(e);
    this._expandedIds = i;
  }
  _startEditing(t, e) {
    this.allowRename && (t.stopPropagation(), this._editingId = e.id, this._editingValue = e.name, this.updateComplete.then(() => {
      var n;
      const i = (n = this.shadowRoot) == null ? void 0 : n.querySelector(".location-name-input");
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
    this._editingId = void 0, !(!e || e === ((i = this.locations.find((n) => n.id === t)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: t, newName: e }, bubbles: !0, composed: !0 }));
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
Se.properties = {
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
  _dropIndicator: { state: !0 },
  _entityDropTargetId: { state: !0 }
}, Se.styles = [
  Qt,
  It`
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

      .tree-item.entity-drop-target {
        background: rgba(var(--rgb-success-color), 0.18);
        box-shadow: inset 0 0 0 1px rgba(var(--rgb-success-color), 0.45);
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

      .type-badge.property {
        background: rgba(var(--rgb-primary-color), 0.22);
        color: var(--primary-color);
      }

      .type-badge.proxy {
        background: rgba(var(--rgb-secondary-text-color, 120, 120, 120), 0.2);
        color: var(--text-secondary-color);
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

      .tree-item.selected .type-badge.property {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.proxy {
        background: var(--text-secondary-color);
        color: var(--card-background-color);
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
let oi = Se;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", oi);
const ht = 30 * 60, qi = 5 * 60;
function An(c) {
  if (!c) return "";
  const t = c.indexOf(".");
  return t >= 0 ? c.slice(0, t) : "";
}
function Ko(c) {
  return ["door", "garage_door", "opening", "window"].includes(c || "");
}
function Yo(c) {
  return ["presence", "occupancy"].includes(c || "");
}
function Xo(c) {
  return c === "motion";
}
function Tn(c) {
  return c === "media_player";
}
function En(c) {
  var i;
  const t = An(c == null ? void 0 : c.entity_id), e = (i = c == null ? void 0 : c.attributes) == null ? void 0 : i.device_class;
  if (Tn(t))
    return {
      entity_id: (c == null ? void 0 : c.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ht,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (c == null ? void 0 : c.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ht,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (c == null ? void 0 : c.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: qi
    };
  if (t === "binary_sensor") {
    if (Yo(e))
      return {
        entity_id: (c == null ? void 0 : c.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: qi
      };
    if (Xo(e))
      return {
        entity_id: (c == null ? void 0 : c.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ht,
        off_event: "none",
        off_trailing: 0
      };
    if (Ko(e))
      return {
        entity_id: (c == null ? void 0 : c.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ht,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (c == null ? void 0 : c.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: ht,
    off_event: "none",
    off_trailing: 0
  };
}
function qe(c, t, e) {
  const i = An(e == null ? void 0 : e.entity_id), n = En(e);
  if (Tn(i)) {
    const a = c.on_timeout && c.on_timeout > 0 ? c.on_timeout : ht;
    return {
      ...c,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const a = c.on_timeout ?? (n.mode === "any_change" ? n.on_timeout : ht);
    return {
      ...c,
      mode: t,
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  const o = n.mode === "specific_states" ? n : {
    ...n,
    on_event: "trigger",
    on_timeout: ht,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...c,
    mode: t,
    on_event: c.on_event ?? o.on_event,
    on_timeout: c.on_timeout ?? o.on_timeout,
    off_event: c.off_event ?? o.off_event,
    off_trailing: c.off_trailing ?? o.off_trailing
  };
}
const Qo = [
  "on_occupied",
  "on_vacant",
  "on_dark",
  "on_bright"
];
function Rn(c) {
  return typeof c == "boolean" ? c : void 0;
}
const Zo = "topomation/actions/rules/list", Jo = "topomation/actions/rules/create", ta = "topomation/actions/rules/delete";
function ea(c) {
  if (!c || typeof c != "object") return;
  const t = c;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function vi(c) {
  const t = ea(c);
  if (t && (t === "unknown_command" || t === "not_found" || t === "not_loaded" || t.endsWith("_not_loaded")))
    return !0;
  const e = oa(c).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported command") || e.includes("command is unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function Lt(c) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${c}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function bi(c) {
  const t = String(c || "").trim().toLowerCase();
  return t === "occupied" ? "on_occupied" : t === "vacant" ? "on_vacant" : t === "dark" ? "on_dark" : t === "bright" ? "on_bright" : t === "on_occupied" || t === "on_vacant" || t === "on_dark" || t === "on_bright" ? t : null;
}
function ai(c, t) {
  const e = /* @__PURE__ */ new Set();
  if (Array.isArray(c))
    for (const i of c) {
      const n = bi(i);
      n && e.add(n);
    }
  return e.size === 0 && t && e.add(t), Qo.filter((i) => e.has(i));
}
function ri(c) {
  return c[0] || "on_occupied";
}
function ia(c) {
  const t = c.includes("on_dark"), e = c.includes("on_bright");
  return t && !e ? "dark" : e && !t ? "bright" : "any";
}
function Dn(c, t, e) {
  const i = String(t || "").trim().toLowerCase();
  return i === "any" || i === "dark" || i === "bright" ? i : e ? "dark" : ia(c);
}
function se(c) {
  if (!c || typeof c != "object" || Array.isArray(c)) return;
  const t = { ...c };
  if (delete t.entity_id, Object.prototype.hasOwnProperty.call(t, "brightness_pct")) {
    const e = Number(t.brightness_pct);
    Number.isFinite(e) && e > 0 ? t.brightness_pct = Math.max(1, Math.min(100, Math.round(e))) : delete t.brightness_pct;
  }
  for (const [e, i] of Object.entries(t))
    (i == null || i === "") && delete t[e];
  return Object.keys(t).length > 0 ? t : void 0;
}
function na(c, t) {
  return c.startsWith("light.") && t === "turn_on";
}
function si(c, t) {
  const i = (Array.isArray(c.actions) ? c.actions : []).map((r) => {
    if (!r || typeof r != "object") return;
    const s = String(r.entity_id || "").trim();
    if (!s) return;
    const d = String(r.service || "").trim() || defaultActionServiceForTrigger(s, t), u = na(s, d) && typeof r.only_if_off == "boolean" ? !!r.only_if_off : void 0;
    return {
      entity_id: s,
      service: d,
      ...se(r.data) ? { data: se(r.data) } : {},
      ...typeof u == "boolean" ? { only_if_off: u } : {}
    };
  }).filter((r) => !!r);
  if (i.length > 0)
    return i;
  const n = String(c.action_entity_id || "").trim();
  if (!n) return [];
  const a = String(c.action_service || "").trim() || defaultActionServiceForTrigger(n, t);
  return [
    {
      entity_id: n,
      service: a,
      ...se(c.action_data) ? { data: se(c.action_data) } : {}
    }
  ];
}
function oa(c) {
  if (typeof c == "string" && c.trim()) return c.trim();
  if (c instanceof Error && c.message.trim()) return c.message.trim();
  if (c && typeof c == "object" && "message" in c) {
    const t = c.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function ce(c, t, e) {
  try {
    const i = await c.callWS({
      type: Zo,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return i.rules.map((n) => {
        const o = bi(n.trigger_type), a = ai(n.trigger_types, o || void 0);
        if (a.length === 0) return null;
        const r = ri(a), s = !!n.require_dark, l = Dn(
          a,
          n.ambient_condition,
          s
        ), d = si(n, r), u = d[0];
        return {
          ...n,
          trigger_type: r,
          trigger_types: a,
          actions: d,
          ambient_condition: l,
          must_be_occupied: Rn(n.must_be_occupied),
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: typeof n.start_time == "string" && n.start_time.length > 0 ? n.start_time : void 0,
          end_time: typeof n.end_time == "string" && n.end_time.length > 0 ? n.end_time : void 0,
          run_on_startup: typeof n.run_on_startup == "boolean" ? n.run_on_startup : void 0,
          require_dark: s || l === "dark",
          action_entity_id: u == null ? void 0 : u.entity_id,
          action_service: u == null ? void 0 : u.service,
          action_data: u == null ? void 0 : u.data
        };
      }).filter((n) => !!n).sort((n, o) => n.name.localeCompare(o.name));
  } catch (i) {
    throw vi(i) ? Lt("rule listing") : i;
  }
  throw Lt("rule listing");
}
async function Gi(c, t, e) {
  const i = ai(t.trigger_types, t.trigger_type), n = ri(i), o = si(
    {
      actions: t.actions,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service,
      action_data: t.action_data
    },
    n
  ), a = o[0];
  if (!a)
    throw new Error("At least one action target is required");
  const r = typeof t.run_on_startup == "boolean" ? t.run_on_startup : void 0;
  try {
    const s = await c.callWS({
      type: Jo,
      location_id: t.location.id,
      name: t.name,
      trigger_type: n,
      trigger_types: i,
      action_entity_id: a.entity_id,
      action_service: a.service,
      action_data: a.data,
      actions: o,
      ambient_condition: t.ambient_condition,
      ...typeof t.must_be_occupied == "boolean" ? { must_be_occupied: t.must_be_occupied } : {},
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: t.start_time,
      end_time: t.end_time,
      ...typeof r == "boolean" ? { run_on_startup: r } : {},
      require_dark: !!t.require_dark,
      ...t.automation_id ? { automation_id: t.automation_id } : {},
      ...t.rule_uuid ? { rule_uuid: t.rule_uuid } : {},
      ...e ? { entry_id: e } : {}
    });
    if (s != null && s.rule) {
      const l = ai(
        s.rule.trigger_types,
        bi(s.rule.trigger_type) || n
      ), d = ri(l), u = !!s.rule.require_dark, p = Dn(
        l,
        s.rule.ambient_condition,
        u
      ), _ = si(s.rule, d), h = _[0] || a;
      return {
        ...s.rule,
        trigger_type: d,
        trigger_types: l,
        rule_uuid: typeof s.rule.rule_uuid == "string" && s.rule.rule_uuid.trim().length > 0 ? s.rule.rule_uuid.trim() : t.rule_uuid,
        actions: _,
        ambient_condition: p,
        action_entity_id: h == null ? void 0 : h.entity_id,
        action_service: h == null ? void 0 : h.service,
        action_data: h == null ? void 0 : h.data,
        must_be_occupied: Rn(s.rule.must_be_occupied),
        time_condition_enabled: !!s.rule.time_condition_enabled,
        start_time: typeof s.rule.start_time == "string" && s.rule.start_time.length > 0 ? s.rule.start_time : void 0,
        end_time: typeof s.rule.end_time == "string" && s.rule.end_time.length > 0 ? s.rule.end_time : void 0,
        run_on_startup: typeof s.rule.run_on_startup == "boolean" ? s.rule.run_on_startup : r,
        require_dark: u || p === "dark"
      };
    }
  } catch (s) {
    throw vi(s) ? Lt("rule creation") : s;
  }
  throw Lt("rule creation");
}
async function Ki(c, t, e) {
  const i = typeof t == "string" ? t : t.id, n = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const o = await c.callWS({
      type: ta,
      automation_id: i,
      ...n ? { entity_id: n } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((o == null ? void 0 : o.success) === !0)
      return;
  } catch (o) {
    throw vi(o) ? Lt("rule deletion") : o;
  }
  throw Lt("rule deletion");
}
var Zi, Ji;
try {
  (Ji = (Zi = import.meta) == null ? void 0 : Zi.hot) == null || Ji.accept(() => window.location.reload());
} catch {
}
const $e = class $e extends ot {
  constructor() {
    super(...arguments), this.allLocations = [], this.adjacencyEdges = [], this.entityRegistryRevision = 0, this.occupancyStates = {}, this.occupancyTransitions = {}, this.handoffTraces = [], this._activeTab = "detection", this._occupancyDraftDirty = !1, this._savingOccupancyDraft = !1, this._pendingOccupancyByLocation = {}, this._externalSourceDialogOpen = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._actionRulesDraftDirty = !1, this._savingActionRules = !1, this._loadingActionRules = !1, this._liveOccupancyStateByLocation = {}, this._nowEpochMs = Date.now(), this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._climateDeviceLinkRevision = 0, this._climateHostDeviceIds = /* @__PURE__ */ new Set(), this._deviceViaParentId = /* @__PURE__ */ new Map(), this._entityRegistryDeviceByEntityId = /* @__PURE__ */ new Map(), this._syncImportInProgress = !1, this._managedShadowAutoRepairInProgress = !1, this._showRecentOccupancyEvents = !1, this._recentEventsDrawerOpen = !0, this._adjacencyNeighborId = "", this._adjacencyBoundaryType = "door", this._adjacencyDirection = "bidirectional", this._adjacencyCrossingSources = "", this._adjacencyHandoffWindowSec = 12, this._adjacencyPriority = 50, this._savingAdjacency = !1, this._wiabInteriorEntityId = "", this._wiabDoorEntityId = "", this._wiabExteriorDoorEntityId = "", this._wiabShowAllEntities = !1, this._ambientDraftDirty = !1, this._loadingAmbientReading = !1, this._savingAmbientConfig = !1, this._floorGroupCreateSelection = [], this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._ambientReadingLoadSeq = 0, this._beforeUnloadHandler = (t) => {
      this._hasUnsavedDrafts() && (t.preventDefault(), t.returnValue = "");
    };
  }
  render() {
    return this.location ? g`
      <div class="inspector-container">
        <div class="inspector-main">
          <div class="inspector-top">${this._renderHeader()} ${this._renderTabs()}</div>
          <div class="inspector-body">
            <div class="inspector-body-content">${this._renderContent()}</div>
          </div>
        </div>
      </div>
      ${this._renderExternalSourceDialog()}
    ` : g`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(t) {
    var e, i;
    if (t.has("hass")) {
      const n = t.get("hass"), o = n == null ? void 0 : n.connection, a = (e = this.hass) == null ? void 0 : e.connection;
      o !== a && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this._liveOccupancyStateByLocation = {}, this.hass ? (this._loadEntityAreaAssignments(), this._loadClimateDeviceLinkIndex(), this._loadActionRules(), this._subscribeAutomationStateChanged()) : (this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), this._automationStateSubscriptionConnection = void 0));
    }
    if (t.has("forcedTab")) {
      const n = this._mapRequestedTab(this.forcedTab);
      n ? this._reconcileActiveTabFromMapped(n) : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const n = t.get("location"), o = (n == null ? void 0 : n.id) || "", a = ((i = this.location) == null ? void 0 : i.id) || "";
      if (o !== a) {
        this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._externalSourceDialogOpen = !1, this._externalAreaId = "", this._externalEntityId = "", this._wiabShowAllEntities = !1, this._managedShadowAutoRepairKey = void 0, this._managedShadowAutoRepairInProgress = !1, this._showRecentOccupancyEvents = !1, this._onTimeoutMemory = {}, this._actionRulesDraft = void 0, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._ambientReading = void 0, this._ambientReadingError = void 0, this._occupancyDraft = void 0, this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {}, this._ambientDraft = void 0, this._ambientDraftDirty = !1, this._ambientSaveError = void 0, this._resetDetectionDraftFromLocation(), this._resetAmbientDraftFromLocation(), this.hass && this._loadEntityAreaAssignments(), this._loadAmbientReading();
        const r = this._mapRequestedTab(this.forcedTab);
        if (r)
          this._reconcileActiveTabFromMapped(r);
        else if (this._isStructuralSummaryLocation()) {
          const s = this._activeTab;
          this._structuralInspectorTabSet().has(s) || (this._activeTab = "detection");
        } else this._isManagedShadowAreaLocation() && this._activeTab === "detection" && (this._activeTab = "lighting");
      } else
        this._occupancyDraftDirty || this._resetDetectionDraftFromLocation(), this._ambientDraftDirty || this._resetAmbientDraftFromLocation();
      this._loadActionRules();
    }
    if (t.has("entryId")) {
      const n = t.get("entryId") || "", o = this.entryId || "";
      n !== o && (this._loadActionRules(), this._loadAmbientReading());
    }
    this._showsManagedShadowControls() && (t.has("allLocations") || t.has("location")) && this._maybeAutoRepairManagedShadowArea(), t.has("entityRegistryRevision") && (this._loadEntityAreaAssignments(), this._loadClimateDeviceLinkIndex());
  }
  /** Classify fan.* targets: HVAC tab only when device registry ties the fan device to a climate entity (same device or via_device parent chain). */
  _fanEntityLinkedToClimate(t) {
    const e = this._entityRegistryDeviceByEntityId.get(t);
    if (!e) return !1;
    const i = /* @__PURE__ */ new Set();
    let n = e;
    for (; n && !i.has(n); ) {
      if (i.add(n), this._climateHostDeviceIds.has(n)) return !0;
      n = this._deviceViaParentId.get(n) ?? void 0;
    }
    return !1;
  }
  async _loadClimateDeviceLinkIndex() {
    var t;
    if ((t = this.hass) != null && t.callWS) {
      if (this._climateLinkIndexLoadPromise) {
        await this._climateLinkIndexLoadPromise;
        return;
      }
      this._climateLinkIndexLoadPromise = (async () => {
        try {
          const [e, i] = await Promise.all([
            this.hass.callWS({ type: "config/entity_registry/list" }),
            this.hass.callWS({ type: "config/device_registry/list" })
          ]), n = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
          if (Array.isArray(i))
            for (const r of i) {
              const s = typeof (r == null ? void 0 : r.id) == "string" ? r.id : "";
              if (!s) continue;
              const l = typeof (r == null ? void 0 : r.via_device_id) == "string" ? r.via_device_id : null;
              o.set(s, l);
            }
          if (Array.isArray(e))
            for (const r of e) {
              const s = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : "", l = typeof (r == null ? void 0 : r.device_id) == "string" ? r.device_id : "";
              s && l && a.set(s, l), s.startsWith("climate.") && l && n.add(l);
            }
          this._climateHostDeviceIds = n, this._deviceViaParentId = o, this._entityRegistryDeviceByEntityId = a, this._climateDeviceLinkRevision += 1;
        } catch (e) {
          console.warn("[ht-location-inspector] climate device link index failed", e);
        } finally {
          this._climateLinkIndexLoadPromise = void 0, this.requestUpdate();
        }
      })(), await this._climateLinkIndexLoadPromise;
    }
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const n = await ce(this.hass, e, this.entryId);
      if (t !== this._actionRulesLoadSeq) return !1;
      const o = this._actionRulesSignature(this._actionRules), a = this._actionRulesSignature(n), r = o !== a;
      return this._actionRules = n, this._actionRulesDraftDirty ? r && (this._resetActionRulesDraftFromLoaded(), this._showToast(
        "Rules changed in Home Assistant. Local draft was reloaded.",
        "warning"
      )) : this._resetActionRulesDraftFromLoaded(), !0;
    } catch (n) {
      return t !== this._actionRulesLoadSeq || (this._actionRulesError = (n == null ? void 0 : n.message) || "Failed to load automation rules"), !1;
    } finally {
      t === this._actionRulesLoadSeq && (this._loadingActionRules = !1, this.requestUpdate());
    }
  }
  _actionRulesSignature(t) {
    const e = t.map((i) => ({
      id: String(i.id || ""),
      entity_id: String(i.entity_id || ""),
      name: String(i.name || ""),
      rule_uuid: String(i.rule_uuid || ""),
      trigger_type: String(i.trigger_type || ""),
      trigger_types: this._normalizeActionTriggerTypes(
        i.trigger_types,
        this._normalizeActionTriggerType(i.trigger_type)
      ),
      action_entity_id: String(i.action_entity_id || ""),
      action_service: String(i.action_service || ""),
      ambient_condition: String(i.ambient_condition || ""),
      must_be_occupied: typeof i.must_be_occupied == "boolean" ? i.must_be_occupied : null,
      time_condition_enabled: !!i.time_condition_enabled,
      start_time: String(i.start_time || ""),
      end_time: String(i.end_time || ""),
      enabled: !!i.enabled
    })).sort((i, n) => `${i.id}|${i.entity_id}`.localeCompare(`${n.id}|${n.entity_id}`));
    return JSON.stringify(e);
  }
  _occupancyDefaults() {
    return {
      version: 1,
      enabled: !0,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_group_id: null,
      occupancy_sources: [],
      linked_locations: [],
      wiab: {
        preset: "off"
      }
    };
  }
  _sanitizeOccupancyConfig(t, e = ((i) => (i = this.location) == null ? void 0 : i.id)()) {
    const n = this._occupancyDefaults(), a = (Array.isArray(t.occupancy_sources) ? t.occupancy_sources : []).filter((d) => d && typeof d.entity_id == "string" && d.entity_id.trim().length > 0).map((d) => this._normalizeSource(d.entity_id.trim(), d)), r = Math.max(1, Number(t.default_timeout) || n.default_timeout), s = Math.max(
      0,
      Number(t.default_trailing_timeout) || n.default_trailing_timeout || 0
    ), l = {
      version: typeof t.version == "number" && Number.isFinite(t.version) ? t.version : n.version,
      enabled: t.enabled !== !1,
      default_timeout: r,
      default_trailing_timeout: s,
      wiab: t.wiab,
      occupancy_group_id: typeof t.occupancy_group_id == "string" && t.occupancy_group_id.trim().length > 0 ? t.occupancy_group_id.trim() : null,
      occupancy_sources: a,
      linked_locations: this._normalizeLinkedLocationIds(t.linked_locations, void 0, e)
    };
    return l.wiab = this._getWiabConfig(l), l;
  }
  _persistedOccupancyConfig() {
    var e, i, n;
    const t = ((i = (e = this.location) == null ? void 0 : e.modules) == null ? void 0 : i.occupancy) || {};
    return this._sanitizeOccupancyConfig(t, (n = this.location) == null ? void 0 : n.id);
  }
  _persistedOccupancyConfigForLocation(t) {
    var i;
    const e = ((i = t.modules) == null ? void 0 : i.occupancy) || {};
    return this._sanitizeOccupancyConfig(e, t.id);
  }
  _detectionTabLabel() {
    return this._isFloorLocation() ? "Occupancy Groups" : "Occupancy";
  }
  _locationType() {
    return this.location ? C(this.location) : null;
  }
  _isAreaLikeLocation() {
    const t = this._locationType();
    return t === "area" || t === "subarea";
  }
  _isStructuralSummaryLocation() {
    const t = this._locationType();
    return t === "floor" || t === "building" || t === "grounds" || t === "property";
  }
  /** Tabs allowed on structural summary locations (no Appliances aggregate tab). */
  _structuralInspectorTabSet() {
    return /* @__PURE__ */ new Set(["detection", "ambient", "lighting", "media", "hvac"]);
  }
  /** Integration-owned managed shadow HA area (device container); occupancy is derived from the tree. */
  _isManagedShadowAreaLocation() {
    return this.location ? this._isManagedShadowLocation(this.location, this._managedShadowLocationIds()) : !1;
  }
  _isDerivedOccupancyLocation() {
    const t = this._locationType();
    return t === "building" || t === "grounds" || t === "property";
  }
  _showsManagedShadowControls() {
    return !1;
  }
  _resetDetectionDraftFromLocation() {
    if (!this.location) {
      this._occupancyDraft = void 0, this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {}, this._floorGroupCreateSelection = [], this._detectionDraftHint = void 0;
      return;
    }
    this._occupancyDraft = this._persistedOccupancyConfig(), this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {}, this._floorGroupCreateSelection = [], this._detectionDraftHint = void 0;
  }
  _setOccupancyDraft(t) {
    var e;
    this._occupancyDraft = this._sanitizeOccupancyConfig(t, (e = this.location) == null ? void 0 : e.id), this._occupancyDraftDirty = !0, this._occupancySaveError = void 0, this._detectionDraftHint = "Changes are staged locally. Click Save changes to apply them.", this.requestUpdate();
  }
  _occupancyConfigForLocation(t) {
    var n;
    const e = this._pendingOccupancyByLocation[t.id];
    if (e)
      return this._sanitizeOccupancyConfig(e, t.id);
    const i = ((n = t.modules) == null ? void 0 : n.occupancy) || {};
    return this._sanitizeOccupancyConfig(i, t.id);
  }
  _setPendingOccupancyForLocation(t, e) {
    const i = this._sanitizeOccupancyConfig(e, t);
    this._pendingOccupancyByLocation = {
      ...this._pendingOccupancyByLocation,
      [t]: i
    }, this._occupancyDraftDirty = !0, this._occupancySaveError = void 0, this._detectionDraftHint = "Changes are staged locally. Click Save changes to apply them.", this.requestUpdate();
  }
  _renderStickyDraftBar(t, e) {
    const { hasUnsaved: i, busy: n, error: o, onDiscard: a, onSave: r } = e;
    if (!i && !n && !o) return "";
    const s = n ? "Saving changes..." : "Unsaved changes";
    return g`
        ${o ? g`<div class="policy-warning">${o}</div>` : ""}
      <div class="sticky-draft-bar" data-testid=${t === "detection" ? "detection-draft-toolbar" : `${t}-sticky-draft-bar`}>
        <div class="sticky-draft-bar-note">${s}</div>
        <div class="sticky-draft-bar-actions">
          <button
            class="button button-secondary"
            type="button"
            data-testid=${t === "detection" ? "detection-discard-button" : `${t}-sticky-discard-button`}
            ?disabled=${n || !i}
            @click=${a}
          >
            Discard
          </button>
          <button
            class="button button-primary draft-save-button"
            type="button"
            data-testid=${t === "detection" ? "detection-save-button" : `${t}-sticky-save-button`}
            ?disabled=${n || !i}
            @click=${r}
          >
            ${n ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    `;
  }
  async _persistOccupancyConfigForLocation(t, e) {
    await this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: t,
        module_id: "occupancy",
        config: e
      })
    );
  }
  async _saveDetectionDraft() {
    var n;
    if (!this.location || !this.hass) return;
    const t = this.location.id, e = this._sanitizeOccupancyConfig(
      this._occupancyDraft || this._persistedOccupancyConfig(),
      t
    ), i = [
      { locationId: t, config: e },
      ...Object.entries(this._pendingOccupancyByLocation).filter(([o]) => o !== t).map(([o, a]) => ({
        locationId: o,
        config: this._sanitizeOccupancyConfig(a, o)
      }))
    ];
    this._savingOccupancyDraft = !0, this._occupancySaveError = void 0, this.requestUpdate();
    try {
      for (const o of i) {
        if (await this._persistOccupancyConfigForLocation(o.locationId, o.config), o.locationId === t && ((n = this.location) == null ? void 0 : n.id) === t) {
          this.location.modules = this.location.modules || {}, this.location.modules.occupancy = o.config;
          continue;
        }
        const a = (this.allLocations || []).find((r) => r.id === o.locationId);
        a && (a.modules = a.modules || {}, a.modules.occupancy = o.config);
      }
      this._resetDetectionDraftFromLocation(), this._showToast("Occupancy settings updated", "success");
    } catch (o) {
      console.error("Failed to update occupancy settings", o), this._occupancySaveError = (o == null ? void 0 : o.message) || "Failed to update occupancy settings", this._showToast(this._occupancySaveError, "error");
    } finally {
      this._savingOccupancyDraft = !1, this.requestUpdate();
    }
  }
  _discardDetectionDraft(t = !0) {
    this._resetDetectionDraftFromLocation(), this.requestUpdate(), t && this._showToast("Discarded occupancy changes", "success");
  }
  _ambientDefaults() {
    return {
      version: 1,
      lux_sensor: null,
      auto_discover: !1,
      inherit_from_parent: !0,
      dark_threshold: 50,
      bright_threshold: 500,
      fallback_to_sun: !0,
      assume_dark_on_error: !0
    };
  }
  _persistedAmbientConfig() {
    var e, i;
    const t = ((i = (e = this.location) == null ? void 0 : e.modules) == null ? void 0 : i.ambient) || {};
    return this._sanitizeAmbientConfig(t);
  }
  _sanitizeAmbientConfig(t) {
    const e = this._ambientDefaults(), i = typeof t.lux_sensor == "string" && t.lux_sensor.trim().length > 0 ? t.lux_sensor.trim() : null, n = Math.max(0, Number(t.dark_threshold) || 0), o = Math.max(
      Math.max(1, n) + 1,
      Number(t.bright_threshold) || 0
    );
    return {
      ...e,
      ...t,
      lux_sensor: i,
      auto_discover: !1,
      inherit_from_parent: typeof t.inherit_from_parent == "boolean" ? t.inherit_from_parent : e.inherit_from_parent,
      dark_threshold: n,
      bright_threshold: o,
      fallback_to_sun: typeof t.fallback_to_sun == "boolean" ? t.fallback_to_sun : e.fallback_to_sun,
      assume_dark_on_error: typeof t.assume_dark_on_error == "boolean" ? t.assume_dark_on_error : e.assume_dark_on_error
    };
  }
  _resetAmbientDraftFromLocation() {
    this._ambientDraft = this._persistedAmbientConfig(), this._ambientDraftDirty = !1, this._ambientSaveError = void 0;
  }
  _ambientConfigSignature(t) {
    const e = this._sanitizeAmbientConfig(t);
    return JSON.stringify({
      lux_sensor: e.lux_sensor ?? null,
      inherit_from_parent: !!e.inherit_from_parent,
      dark_threshold: e.dark_threshold,
      bright_threshold: e.bright_threshold,
      fallback_to_sun: !!e.fallback_to_sun,
      assume_dark_on_error: !!e.assume_dark_on_error
    });
  }
  _getAmbientConfig() {
    return this.location ? this._sanitizeAmbientConfig(this._ambientDraft || this._persistedAmbientConfig()) : this._sanitizeAmbientConfig(this._ambientDefaults());
  }
  _setAmbientDraft(t) {
    const e = this._sanitizeAmbientConfig(t);
    this._ambientDraft = e, this._ambientDraftDirty = this._ambientConfigSignature(e) !== this._ambientConfigSignature(this._persistedAmbientConfig()), this._ambientSaveError = void 0, this.requestUpdate();
  }
  async _saveAmbientDraft() {
    if (!this.location || !this.hass) return;
    this._savingAmbientConfig = !0, this._ambientSaveError = void 0;
    const t = this._sanitizeAmbientConfig(this._ambientDraft || this._persistedAmbientConfig());
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "ambient",
          config: t
        })
      ), this.location.modules = this.location.modules || {}, this.location.modules.ambient = t, this._ambientDraft = t, this._ambientDraftDirty = !1, await this._loadAmbientReading(), this._showToast("Ambient settings updated", "success");
    } catch (e) {
      console.error("Failed to update ambient settings", e), this._ambientSaveError = (e == null ? void 0 : e.message) || "Failed to update ambient settings", this._showToast(this._ambientSaveError, "error");
    } finally {
      this._savingAmbientConfig = !1, this.requestUpdate();
    }
  }
  _discardAmbientDraft(t = !0) {
    this._resetAmbientDraftFromLocation(), this._loadAmbientReading(), this.requestUpdate(), t && this._showToast("Discarded ambient changes", "success");
  }
  async _loadAmbientReading() {
    const t = ++this._ambientReadingLoadSeq;
    if (!this.location || !this.hass) {
      this._ambientReading = void 0, this._ambientReadingError = void 0, this._loadingAmbientReading = !1;
      return;
    }
    this._loadingAmbientReading = !0, this._ambientReadingError = void 0, this.requestUpdate();
    try {
      const e = this._getAmbientConfig(), i = await this.hass.callWS(
        this._withEntryId({
          type: "topomation/ambient/get_reading",
          location_id: this.location.id,
          dark_threshold: e.dark_threshold,
          bright_threshold: e.bright_threshold
        })
      );
      if (t !== this._ambientReadingLoadSeq) return;
      this._ambientReading = i, this._hydrateAmbientDraftFromReading(i), this._ambientReadingError = void 0;
    } catch (e) {
      if (t !== this._ambientReadingLoadSeq) return;
      this._ambientReading = void 0, this._ambientReadingError = (e == null ? void 0 : e.message) || "Failed to load ambient reading";
    } finally {
      t === this._ambientReadingLoadSeq && (this._loadingAmbientReading = !1, this.requestUpdate());
    }
  }
  _hydrateAmbientDraftFromReading(t) {
    if (this._ambientDraftDirty) return;
    const e = this._persistedAmbientConfig();
    if (e.lux_sensor) return;
    const i = typeof t.source_sensor == "string" ? t.source_sensor.trim() : "";
    if (!i || t.is_inherited === !0 || !this._isSelectableLuxSensor(i)) return;
    const n = this._sanitizeAmbientConfig({
      ...e,
      lux_sensor: i,
      inherit_from_parent: !1
    });
    this._ambientDraft = n, this._ambientDraftDirty = !1, this._ambientSaveError = void 0;
  }
  _ambientSourceMethod(t) {
    if (!t) return "unknown";
    if (t.source_sensor) return t.is_inherited ? "inherited_sensor" : "sensor";
    const e = String(t.fallback_method || "").trim().toLowerCase();
    return e ? e.includes("sun") ? "sun_fallback" : e === "assume_dark" ? "assume_dark" : e === "assume_bright" ? "assume_bright" : e : "unknown";
  }
  _ambientSourceMethodLabel(t) {
    return t === "sensor" ? "Sensor" : t === "inherited_sensor" ? "Inherited sensor" : t === "sun_fallback" ? "Sun fallback" : t === "assume_dark" ? "Assume dark" : t === "assume_bright" ? "Assume bright" : "Unknown";
  }
  _formatAmbientLux(t) {
    const e = t == null ? void 0 : t.lux;
    return typeof e != "number" || Number.isNaN(e) ? "n/a" : `${e.toFixed(1)} lx`;
  }
  _ambientStateLabel(t) {
    return (t == null ? void 0 : t.is_dark) === !0 ? "Dark" : (t == null ? void 0 : t.is_bright) === !0 ? "Bright" : (t == null ? void 0 : t.is_dark) === !1 && (t == null ? void 0 : t.is_bright) === !1 ? "Neutral" : "Unknown";
  }
  _ambientSensorCandidates() {
    var o, a;
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set(), e = this._getAmbientConfig();
    typeof e.lux_sensor == "string" && e.lux_sensor.trim() && t.add(e.lux_sensor.trim());
    const i = typeof ((o = this._ambientReading) == null ? void 0 : o.source_sensor) == "string" ? this._ambientReading.source_sensor.trim() : "";
    i && t.add(i);
    for (const r of this.location.entity_ids || [])
      this._isLuxSensorEntity(r) && t.add(r);
    const n = ((a = this.hass) == null ? void 0 : a.states) || {};
    for (const r of this._deviceEnumerationHaAreaIds())
      for (const s of Object.keys(n))
        this._entityIsInArea(s, r) && this._isLuxSensorEntity(s) && t.add(s);
    for (const r of this._deviceEnumerationExtraEntityIds())
      this._isLuxSensorEntity(r) && t.add(r);
    return [...t].sort((r, s) => this._entityName(r).localeCompare(this._entityName(s)));
  }
  /**
   * HA area ids used to enumerate devices for ambient lux, action rules, etc.
   * Includes the location's own `ha_area_id` plus the managed shadow's HA area
   * when this node is a shadow host (property / building / grounds / floor).
   */
  _deviceEnumerationHaAreaIds() {
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set(), e = this.location.ha_area_id;
    if (typeof e == "string" && e.trim() && t.add(e.trim()), this._isManagedShadowHost()) {
      const i = de(this.location);
      if (i) {
        const n = this._managedShadowAreaById(i), o = n == null ? void 0 : n.ha_area_id;
        typeof o == "string" && o.trim() && t.add(o.trim());
      }
    }
    return [...t];
  }
  /** Entity ids attached to this host's managed shadow wrapper (if any). */
  _deviceEnumerationExtraEntityIds() {
    if (!this.location || !this._isManagedShadowHost()) return [];
    const t = de(this.location);
    if (!t) return [];
    const e = this._managedShadowAreaById(t);
    return Array.isArray(e == null ? void 0 : e.entity_ids) ? [...e.entity_ids] : [];
  }
  _selectedAmbientSensorId(t, e) {
    const i = typeof t.lux_sensor == "string" ? t.lux_sensor.trim() : "";
    if (i) return i;
    const n = typeof (e == null ? void 0 : e.source_sensor) == "string" ? e.source_sensor.trim() : "";
    return n && (e == null ? void 0 : e.is_inherited) !== !0 ? n : "";
  }
  _isLuxSensorEntity(t) {
    var i, n;
    const e = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t];
    return this._isLuxSensorEntityForState(t, e);
  }
  _isSelectableLuxSensor(t) {
    var n, o;
    const e = (o = (n = this.hass) == null ? void 0 : n.states) == null ? void 0 : o[t];
    if (!this._isLuxSensorEntityForState(t, e)) return !1;
    const i = String((e == null ? void 0 : e.state) || "").trim().toLowerCase();
    return i !== "" && i !== "unknown" && i !== "unavailable";
  }
  _isLuxSensorEntityForState(t, e) {
    if (!e || !t.startsWith("sensor.")) return !1;
    const i = e.attributes || {};
    if (String(i.device_class || "").toLowerCase() === "illuminance") return !0;
    const o = String(i.unit_of_measurement || "").toLowerCase();
    if (o === "lx" || o === "lux") return !0;
    const a = t.toLowerCase();
    return a.includes("lux") || a.includes("illuminance") || a.includes("light_level");
  }
  async _loadEntityAreaAssignments() {
    var t;
    this._entityAreaLoadPromise || !((t = this.hass) != null && t.callWS) || (this._entityAreaLoadPromise = (async () => {
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "config/entity_registry/list" }),
          this.hass.callWS({ type: "config/device_registry/list" })
        ]), n = /* @__PURE__ */ new Map();
        if (Array.isArray(i))
          for (const r of i) {
            const s = typeof (r == null ? void 0 : r.id) == "string" ? r.id : void 0, l = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0;
            s && l && n.set(s, l);
          }
        const o = {}, a = {};
        if (Array.isArray(e))
          for (const r of e) {
            const s = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : void 0;
            if (!s) continue;
            const l = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0, d = typeof (r == null ? void 0 : r.device_id) == "string" ? n.get(r.device_id) : void 0;
            o[s] = l || d || null, a[s] = {
              hiddenBy: typeof (r == null ? void 0 : r.hidden_by) == "string" ? r.hidden_by : null,
              disabledBy: typeof (r == null ? void 0 : r.disabled_by) == "string" ? r.disabled_by : null,
              entityCategory: typeof (r == null ? void 0 : r.entity_category) == "string" ? r.entity_category : null
            };
          }
        this._entityAreaById = o, this._entityRegistryMetaById = a;
      } catch {
        this._entityAreaById = {}, this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, n = this._getLockState(), o = this._getOccupancyState(), a = this._isStructuralSummaryLocation() ? this._aggregateOccupiedStateForStructural() : this._resolveOccupiedState(o), r = a === !0, s = a === !0 ? "Occupied" : a === !1 ? "Vacant" : "Unknown", l = this._resolveVacancyReason(o, a), d = this._resolveOccupiedReason(o, a), u = r ? d : l, p = o ? this._resolveVacantAt(o.attributes || {}, r) : void 0, _ = r ? this._formatVacantAtLabel(p) : void 0, f = this._ambientSourceMethod(this._ambientReading) === "inherited_sensor" ? " (inherited)" : "", m = this._loadingAmbientReading ? "Ambient: loading..." : this._ambientReadingError ? "Ambient: unavailable" : `Ambient: ${this._formatAmbientLux(this._ambientReading)}${f}`;
    return g`
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
                .title=${u || ""}
              >
                ${s}
              </span>
              ${n.isLocked ? g`
                    <span class="status-chip locked" data-testid="header-lock-status">Locked</span>
                  ` : g`
                    <span class="header-lock-state" data-testid="header-lock-status">Unlocked</span>
                  `}
              <span class="header-ambient" data-testid="header-ambient-lux">
                ${m}
              </span>
              ${r ? g`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${_}
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
    var i, n, o;
    const e = t.ha_area_id;
    return e && ((o = (n = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : n[e]) != null && o.icon) ? this.hass.areas[e].icon : kn(t);
  }
  /** Structural hosts: rollup occupancy, ambient, and aggregate device automation (ADR-HA-078). */
  _renderStructuralTabs() {
    const t = this._detectionTabLabel();
    return g`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => this._handleTabChange("detection")}
        >
          ${t}
        </button>
        <button
          class="tab ${this._activeTab === "ambient" ? "active" : ""}"
          @click=${() => this._handleTabChange("ambient")}
        >
          Ambient
        </button>
        <button
          class="tab ${this._activeTab === "lighting" ? "active" : ""}"
          @click=${() => this._handleTabChange("lighting")}
        >
          Lighting
        </button>
        <button
          class="tab ${this._activeTab === "media" ? "active" : ""}"
          @click=${() => this._handleTabChange("media")}
        >
          Media
        </button>
        <button
          class="tab ${this._activeTab === "hvac" ? "active" : ""}"
          @click=${() => this._handleTabChange("hvac")}
        >
          HVAC
        </button>
      </div>
    `;
  }
  _renderTabs() {
    if (this._isStructuralSummaryLocation())
      return this._renderStructuralTabs();
    const t = this._detectionTabLabel(), e = this._isManagedShadowAreaLocation();
    return g`
      <div class="tabs">
        ${e ? "" : g`
              <button
                class="tab ${this._activeTab === "detection" ? "active" : ""}"
                @click=${() => this._handleTabChange("detection")}
              >
                ${t}
              </button>
            `}
        <button
          class="tab ${this._activeTab === "ambient" ? "active" : ""}"
          @click=${() => this._handleTabChange("ambient")}
        >
          Ambient
        </button>
        <button
          class="tab ${this._activeTab === "lighting" ? "active" : ""}"
          @click=${() => this._handleTabChange("lighting")}
        >
          Lighting
        </button>
        <button
          class="tab ${this._activeTab === "appliances" ? "active" : ""}"
          @click=${() => this._handleTabChange("appliances")}
        >
          Appliances
        </button>
        <button
          class="tab ${this._activeTab === "media" ? "active" : ""}"
          @click=${() => this._handleTabChange("media")}
        >
          Media
        </button>
        <button
          class="tab ${this._activeTab === "hvac" ? "active" : ""}"
          @click=${() => this._handleTabChange("hvac")}
        >
          HVAC
        </button>
      </div>
    `;
  }
  _renderContent() {
    const t = this._effectiveTab(), i = !this._isStructuralSummaryLocation() && !this._isManagedShadowAreaLocation() ? this._renderStickyDraftBar("detection", {
      hasUnsaved: this._occupancyDraftDirty,
      busy: this._savingOccupancyDraft,
      error: this._occupancySaveError,
      onDiscard: () => this._discardDetectionDraft(),
      onSave: () => this._saveDetectionDraft()
    }) : "", n = this._renderStickyDraftBar("ambient", {
      hasUnsaved: this._ambientDraftDirty,
      busy: this._savingAmbientConfig,
      error: this._ambientSaveError,
      onDiscard: () => this._discardAmbientDraft(),
      onSave: () => this._saveAmbientDraft()
    });
    return g`
      <div class="tab-content">
        ${t === "detection" ? g`${i}${this._renderOccupancyTab()} ${this._renderAdvancedTab()}` : t === "ambient" ? g`${n}${this._renderAmbientTab()}` : t === "lighting" ? this._renderDeviceAutomationTab("lighting") : t === "appliances" ? this._renderDeviceAutomationTab("appliances") : t === "media" ? this._renderDeviceAutomationTab("media") : t === "hvac" ? this._renderDeviceAutomationTab("hvac") : ""}
      </div>
    `;
  }
  _effectiveTab() {
    return this._isStructuralSummaryLocation() ? this._structuralInspectorTabSet().has(this._activeTab) ? this._activeTab : "detection" : this._isManagedShadowAreaLocation() && this._activeTab === "detection" ? "lighting" : this._activeTab;
  }
  _hasUnsavedDrafts() {
    return !!(this._occupancyDraftDirty || this._ambientDraftDirty || this._actionRulesDraftDirty);
  }
  _handleTabChange(t) {
    if (this._activeTab !== t) {
      if (this._activeTab === "detection" && this._occupancyDraftDirty) {
        if (!window.confirm(
          "Occupancy changes are not saved. Discard changes and continue?"
        )) return;
        this._discardDetectionDraft(!1);
      }
      if (this._activeTab === "ambient" && this._ambientDraftDirty) {
        if (!window.confirm(
          "Ambient changes are not saved. Discard changes and continue?"
        )) return;
        this._discardAmbientDraft(!1);
      }
      this._externalSourceDialogOpen && this._closeExternalSourceDialog(), this._activeTab = t, this.requestUpdate();
    }
  }
  /** Apply parent `forcedTab` (and structural / managed-shadow constraints) to `_activeTab`. */
  _reconcileActiveTabFromMapped(t) {
    let e = t;
    this._isManagedShadowAreaLocation() && e === "detection" && (e = "lighting"), this._isStructuralSummaryLocation() && !this._structuralInspectorTabSet().has(e) && (e = "detection"), this._activeTab = e;
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "ambient") return "ambient";
    if (t === "lighting") return "lighting";
    if (t === "appliances") return "appliances";
    if (t === "media") return "media";
    if (t === "hvac") return "hvac";
    if (t === "occupancy") return "detection";
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("beforeunload", this._beforeUnloadHandler), this._startClockTicker(), this._subscribeAutomationStateChanged();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("beforeunload", this._beforeUnloadHandler), this._stopClockTicker(), this._resetSourceDraftState(), this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), this._automationStateSubscriptionConnection = void 0;
  }
  _scheduleActionRulesReload(t = 250) {
    this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._actionRulesReloadTimer = window.setTimeout(() => {
      this._actionRulesReloadTimer = void 0, this._loadActionRules();
    }, t);
  }
  _scheduleAmbientReadingReload(t = 300) {
    !this.location || !this.hass || (this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._ambientReadingReloadTimer = window.setTimeout(() => {
      this._ambientReadingReloadTimer = void 0, this._loadAmbientReading();
    }, t));
  }
  async _subscribeAutomationStateChanged() {
    var e;
    const t = (e = this.hass) == null ? void 0 : e.connection;
    if (!(t != null && t.subscribeEvents)) {
      this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), this._automationStateSubscriptionConnection = void 0;
      return;
    }
    if (!(this._unsubAutomationStateChanged && this._automationStateSubscriptionConnection === t)) {
      this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0);
      try {
        this._unsubAutomationStateChanged = await t.subscribeEvents(
          (i) => {
            var l, d, u;
            const n = (l = i == null ? void 0 : i.data) == null ? void 0 : l.entity_id, o = (d = i == null ? void 0 : i.data) == null ? void 0 : d.new_state, a = (u = i == null ? void 0 : i.data) == null ? void 0 : u.old_state, r = (o == null ? void 0 : o.attributes) || {}, s = (a == null ? void 0 : a.attributes) || {};
            if (typeof n == "string" && n.startsWith("binary_sensor.")) {
              const p = typeof r.location_id == "string" ? r.location_id : void 0, _ = typeof s.location_id == "string" ? s.location_id : void 0, h = p || _, f = r.device_class === "occupancy", m = s.device_class === "occupancy";
              if (h && (f || m)) {
                if (o && f)
                  this._liveOccupancyStateByLocation = {
                    ...this._liveOccupancyStateByLocation,
                    [h]: o
                  };
                else {
                  const { [h]: $, ...k } = this._liveOccupancyStateByLocation;
                  this._liveOccupancyStateByLocation = k;
                }
                const v = this._effectiveOccupancyTopologyId();
                v && h === v && this.requestUpdate();
              }
            }
            typeof n == "string" && this._isAmbientStateChangeRelevant(n, o, a) && this._scheduleAmbientReadingReload(), !(typeof n != "string" || !n.startsWith("automation.")) && this._scheduleActionRulesReload();
          },
          "state_changed"
        ), this._automationStateSubscriptionConnection = t;
      } catch {
        this._automationStateSubscriptionConnection = void 0;
      }
    }
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this._getOccupancyConfig(), e = this._isFloorLocation(), i = this._isDerivedOccupancyLocation(), n = !!this.location.ha_area_id, o = this._isSiblingAreaSourceScope(), a = (t.occupancy_sources || []).length, r = this._getLockState();
    return e ? g`
        <div>
          <div class="card-section">
            <div class="section-title">
              <ha-icon .icon=${"mdi:view-grid-plus"}></ha-icon>
              Occupancy Groups
            </div>
            <div class="policy-note">
              Group this floor's child areas when they should behave like one occupied space.
              Group membership is authored here and persisted onto the member areas.
            </div>
            ${a > 0 ? g`
                  <div class="policy-warning">
                    This floor still has ${a} unsupported source${a === 1 ? "" : "s"} in
                    config. Floor sources are unsupported and should be moved to areas.
                  </div>
                ` : ""}
          </div>
          ${this._renderFloorOccupancyGroupsSection()}
          ${this._renderStructuralOverviewSection()}
        </div>
      ` : i ? this._renderDerivedOccupancyTab() : g`
      <div>
        <div class="card-section">
          ${r.isLocked ? g`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${r.lockedBy.length ? g`Held by ${r.lockedBy.join(", ")}.` : g`Occupancy is currently held by a lock.`}
              </div>
              ${r.lockModes.length ? g`
                    <div class="runtime-note">
                      Modes: ${r.lockModes.map((s) => this._lockModeLabel(s)).join(", ")}
                    </div>
                  ` : ""}
              ${r.directLocks.length ? g`
                    <div class="lock-directive-list">
                      ${r.directLocks.map((s) => g`
                        <div class="lock-directive">
                          <span class="lock-pill">${s.sourceId}</span>
                          <span>${this._lockModeLabel(s.mode)}</span>
                          <span>${this._lockScopeLabel(s.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : g`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="sources-heading">
            <div class="section-title">Sources</div>
            <div class="sources-inline-help">
              ${n ? "Select sensors in this area." : "Integration-owned location: choose sources from Home Assistant entities."}
            </div>
          </div>
          ${n ? "" : g`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="external-source-section">
            <div class="section-title-row">
              <div>
                <div class="subsection-title">Add Source</div>
                <div class="subsection-help">
                  ${n ? o ? "Need more coverage? Add a source from a sibling area or include all compatible entities from this area." : "Need more coverage? Add a source from another area or include all compatible entities from this area." : "Add a source from any HA area (including unassigned entities)."}
                </div>
              </div>
              <div class="external-source-launch">
                <button
                  class="button button-secondary"
                  type="button"
                  data-testid="open-external-source-dialog"
                  @click=${() => this._openExternalSourceDialog()}
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>
        ${this._isAreaLikeLocation() ? this._renderAreaOccupancyGroupSection(t) : ""}
      </div>
    `;
  }
  _renderDerivedOccupancyTab() {
    if (!this.location) return "";
    const t = this._recentExplainabilityCurrentState(), e = this._locationType() || "location", i = e === "building" ? "Building" : e === "grounds" ? "Grounds" : e === "property" ? "Property" : "Location", n = ((t == null ? void 0 : t.contributors) || []).map((o) => o.sourceLabel);
    return g`
      <div>
        <div class="card-section" data-testid="derived-occupancy-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:home-analytics"}></ha-icon>
            Derived Occupancy
          </div>
          <div class="policy-note">
            ${i} occupancy is derived from child locations. Add occupancy sources to floors and
            areas, not here.
          </div>
          <div class="subsection-help">
            This ${e} becomes occupied when one of its descendant locations is occupied.
          </div>
          ${t ? g`
                <div class="occupancy-explainability-grid" style="margin-top: 12px;">
                  <div class="occupancy-explainability-panel">
                    <div class="occupancy-explainability-panel-title">Current state</div>
                    <div class="occupancy-status-chip ${t.occupied ? "is-occupied" : "is-vacant"}">
                      ${t.occupied ? "Occupied" : "Vacant"}
                    </div>
                    <div class="occupancy-summary-lines">
                      <div class="occupancy-summary-line">
                        <div class="occupancy-summary-label">Why</div>
                        <div class="occupancy-summary-value">${t.why}</div>
                      </div>
                      ${t.nextChange ? g`
                            <div class="occupancy-summary-line">
                              <div class="occupancy-summary-label">Next change</div>
                              <div class="occupancy-summary-value">${t.nextChange}</div>
                            </div>
                          ` : ""}
                    </div>
                  </div>
                  <div class="occupancy-explainability-panel">
                    <div class="occupancy-explainability-panel-title">Active child locations</div>
                    ${n.length ? g`
                          <div class="occupancy-events">
                            ${n.map((o) => g`
                              <div class="occupancy-event">
                                <span class="occupancy-event-source">${o}</span>
                              </div>
                            `)}
                          </div>
                        ` : g`
                          <div class="occupancy-empty-state">
                            No child locations are actively holding this ${e} occupied.
                          </div>
                        `}
                  </div>
                  ${this._renderStructureSummaryPanel()}
                </div>
              ` : g`
                <div class="occupancy-explainability-grid" style="margin-top: 12px;">
                  <div class="occupancy-explainability-panel">
                    <div class="occupancy-explainability-panel-title">Current state</div>
                    <div class="occupancy-empty-state">No derived occupancy state is available yet.</div>
                  </div>
                  ${this._renderStructureSummaryPanel()}
                </div>
              `}
        </div>
      </div>
    `;
  }
  _renderStructuralOverviewSection() {
    if (!this.location || !this._isStructuralSummaryLocation()) return "";
    const t = this._locationType() || "location";
    return g`
      <div class="card-section" data-testid="structural-overview-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:shape-outline"}></ha-icon>
          ${t === "floor" ? "Floor Summary" : t === "building" ? "Building Summary" : t === "grounds" ? "Grounds Summary" : t === "property" ? "Property Summary" : "Summary"}
        </div>
        <div class="policy-note">
          This ${t} is a structural summary node. Use child areas for direct automation and source authoring.
        </div>
        <div class="occupancy-explainability-grid" style="margin-top: 12px;">
          ${this._renderStructureSummaryPanel()}
          ${this._renderStructuralCurrentStatePanel()}
        </div>
      </div>
    `;
  }
  _renderStructuralCurrentStatePanel() {
    const t = this._recentExplainabilityCurrentState();
    return t ? g`
      <div class="occupancy-explainability-panel">
        <div class="occupancy-explainability-panel-title">Occupancy</div>
        <div class="occupancy-status-chip ${t.occupied ? "is-occupied" : "is-vacant"}">
          ${t.occupied ? "Occupied" : "Vacant"}
        </div>
        <div class="occupancy-summary-lines">
          <div class="occupancy-summary-line">
            <div class="occupancy-summary-label">Why</div>
            <div class="occupancy-summary-value">${t.why}</div>
          </div>
          ${t.nextChange ? g`
                <div class="occupancy-summary-line">
                  <div class="occupancy-summary-label">Next change</div>
                  <div class="occupancy-summary-value">${t.nextChange}</div>
                </div>
              ` : ""}
        </div>
      </div>
    ` : g`
        <div class="occupancy-explainability-panel">
          <div class="occupancy-explainability-panel-title">Occupancy</div>
          <div class="occupancy-empty-state">No occupancy state is available yet.</div>
        </div>
      `;
  }
  _renderStructureSummaryPanel() {
    const t = this._structureSummary();
    return t ? g`
      <div class="occupancy-explainability-panel" data-testid="structure-summary-panel">
        <div class="occupancy-explainability-panel-title">Structure</div>
        <div class="occupancy-summary-lines">
          <div class="occupancy-summary-line">
            <div class="occupancy-summary-label">Direct children</div>
            <div class="occupancy-summary-value">${t.directChildren}</div>
          </div>
          <div class="occupancy-summary-line">
            <div class="occupancy-summary-label">Descendant rooms</div>
            <div class="occupancy-summary-value">${t.descendantRooms}</div>
          </div>
          <div class="occupancy-summary-line">
            <div class="occupancy-summary-label">Occupied descendants</div>
            <div class="occupancy-summary-value">${t.occupiedDescendants}</div>
          </div>
        </div>
      </div>
    ` : "";
  }
  _renderAmbientTab() {
    return this.location ? g`<div>${this._renderAmbientSection()}</div>` : "";
  }
  _renderAdvancedTab() {
    if (!this.location || !this._isAreaLikeLocation()) return "";
    const t = this._getOccupancyConfig();
    return g`
      <div>
        ${this._renderWiabSection(t)}
        ${this._showsManagedShadowControls() && this._isManagedShadowHost() ? this._renderManagedShadowAreaSection() : ""}
      </div>
    `;
  }
  _renderRecentOccupancyEventsDrawer() {
    const t = this._recentExplainabilityCurrentState(), e = this._recentExplainabilityChanges();
    if (!t && e.length === 0) return "";
    const i = this._showRecentOccupancyEvents ? e : e.slice(0, 5);
    return g`
      <div
        class="recent-events-drawer ${this._recentEventsDrawerOpen ? "medium" : "collapsed"}"
        data-testid="recent-occupancy-events-drawer"
      >
        <div class="recent-events-drawer-header">
          <div class="recent-events-drawer-title">
            <ha-icon .icon=${"mdi:timeline-clock-outline"}></ha-icon>
            Occupancy Explainability
          </div>
          <div class="recent-events-drawer-controls">
            <button
              class="button button-secondary"
              type="button"
              style="padding: 2px 8px; font-size: 11px;"
              data-testid="recent-events-collapse-toggle"
              @click=${() => {
      this._recentEventsDrawerOpen = !this._recentEventsDrawerOpen;
    }}
            >
              ${this._recentEventsDrawerOpen ? "Collapse" : "Open"}
            </button>
          </div>
        </div>
        <div class="recent-events-drawer-body">
          <div class="recent-events-drawer-help">
            <span>See why this location is in its current state and what changed most recently.</span>
            ${e.length > 5 ? g`
                  <button
                    class="button button-secondary"
                    type="button"
                    style="padding: 2px 8px; font-size: 11px;"
                    data-testid="recent-events-toggle"
                    @click=${() => {
      this._showRecentOccupancyEvents = !this._showRecentOccupancyEvents;
    }}
                  >
                    ${this._showRecentOccupancyEvents ? "Show less" : "Show all"}
                  </button>
                ` : ""}
          </div>
          <div class="occupancy-explainability">
            ${t ? g`
                  <div class="occupancy-explainability-grid">
                    <div class="occupancy-explainability-panel">
                      <div class="occupancy-explainability-panel-title">Current state</div>
                      <div
                        class="occupancy-status-chip ${t.occupied ? "is-occupied" : "is-vacant"}"
                      >
                        ${t.occupied ? "Occupied" : "Vacant"}
                      </div>
                      <div class="occupancy-summary-lines">
                        <div class="occupancy-summary-line">
                          <div class="occupancy-summary-label">Why</div>
                          <div class="occupancy-summary-value">${t.why}</div>
                        </div>
                        ${t.nextChange ? g`
                              <div class="occupancy-summary-line">
                                <div class="occupancy-summary-label">Next change</div>
                                <div class="occupancy-summary-value">${t.nextChange}</div>
                              </div>
                            ` : ""}
                        ${t.lockedSummary ? g`
                              <div class="occupancy-summary-line">
                                <div class="occupancy-summary-label">Lock</div>
                                <div class="occupancy-summary-value">${t.lockedSummary}</div>
                              </div>
                            ` : ""}
                      </div>
                    </div>
                    <div class="occupancy-explainability-panel">
                      <div class="occupancy-explainability-panel-title">Active contributors</div>
                      ${t.contributors.length ? g`
                            <div class="occupancy-events">
                              ${t.contributors.map(
      (n) => g`
                                  <div class="occupancy-event">
                                    <span class="occupancy-event-source">${n.sourceLabel}</span>
                                    <span class="occupancy-event-meta">${n.stateLabel}</span>
                                    <span class="occupancy-event-meta">${n.relativeTime}</span>
                                  </div>
                                `
    )}
                            </div>
                          ` : g`<div class="occupancy-empty-state">No active contributors.</div>`}
                    </div>
                  </div>
                ` : ""}
            <div class="occupancy-explainability-panel">
              <div class="occupancy-explainability-panel-title">Recent changes</div>
              ${i.length ? g`
                    <div class="occupancy-events">
                      ${i.map(
      (n) => g`
                          <div class="occupancy-event">
                            <span class="occupancy-event-time">${n.timeLabel}</span>
                            <div class="occupancy-event-copy">
                              <span class="occupancy-event-source">${n.title}</span>
                              <span class="occupancy-event-description">${n.description}</span>
                            </div>
                            <span class="occupancy-event-meta">${n.relativeTime}</span>
                          </div>
                        `
    )}
                    </div>
                  ` : g`<div class="occupancy-empty-state">No recent occupancy changes yet.</div>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _isAmbientStateChangeRelevant(t, e, i) {
    var u, p, _, h;
    if (!this.location) return !1;
    const n = this._getAmbientConfig(), o = String(((u = this._ambientReading) == null ? void 0 : u.source_sensor) || "").trim(), a = String(n.lux_sensor || "").trim(), r = String(((p = this._ambientReading) == null ? void 0 : p.fallback_method) || "").toLowerCase(), s = !!n.fallback_to_sun || r.includes("sun");
    if (t === "sun.sun" && s) return !0;
    if (!t.startsWith("sensor.")) return !1;
    const l = e || i || ((h = (_ = this.hass) == null ? void 0 : _.states) == null ? void 0 : h[t]);
    if (!this._isLuxSensorEntityForState(t, l)) return !1;
    if (t === o || t === a || (this.location.entity_ids || []).includes(t)) return !0;
    const d = this._resolveEntityAreaId(t, l);
    if (d) {
      for (const f of this._deviceEnumerationHaAreaIds())
        if (d === f) return !0;
    }
    return !!(this._deviceEnumerationExtraEntityIds() || []).includes(t);
  }
  _renderAmbientSection() {
    if (!this.location) return "";
    const t = this._getAmbientConfig(), e = this._ambientReading, i = this._ambientSensorCandidates(), n = this._ambientSourceMethod(e), o = this._ambientSourceMethodLabel(n), a = (e == null ? void 0 : e.source_sensor) || "-", r = typeof (e == null ? void 0 : e.source_location) == "string" && e.source_location ? this._locationName(e.source_location) : "-", s = this._ambientStateLabel(e), l = Math.max(0, Number(t.dark_threshold) || 0), d = Math.max(l + 1, Number(t.bright_threshold) || l + 1), u = this._selectedAmbientSensorId(t, e), p = "Inherit from parent", _ = this._savingAmbientConfig;
    return g`
      <div class="card-section" data-testid="ambient-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${"mdi:weather-sunny"}></ha-icon>
            Ambient
          </div>
        </div>

        ${this._ambientReadingError ? g`
              <div class="policy-warning" data-testid="ambient-error">${this._ambientReadingError}</div>
            ` : ""}
        <div class="ambient-grid">
          <div class="ambient-key">Lux level</div>
          <div class="ambient-value" data-testid="ambient-lux-level">${this._formatAmbientLux(e)}</div>
          <div class="ambient-key">Ambient state</div>
          <div class="ambient-value" data-testid="ambient-state">${s}</div>
          <div class="ambient-key">Source method</div>
          <div class="ambient-value" data-testid="ambient-source-method">${o}</div>
          <div class="ambient-key">Source sensor</div>
          <div class="ambient-value" data-testid="ambient-source-sensor">${a}</div>
          <div class="ambient-key">Source location</div>
          <div class="ambient-value" data-testid="ambient-source-location">${r}</div>
        </div>

        <div class="policy-note" style="margin-bottom: 8px;">
          Lux sensor assignment is explicit. Set a location sensor or inherit from parent.
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Lux sensor</div>
            <div class="config-help">Choose a direct illuminance sensor or inherit from the parent location.</div>
          </div>
          <div class="config-value">
            <select
              ?disabled=${_}
              data-testid="ambient-lux-sensor-select"
              @change=${(h) => {
      const f = h.target.value.trim();
      this._setAmbientDraft({
        ...t,
        lux_sensor: f || null,
        inherit_from_parent: !f
      }), this._scheduleAmbientReadingReload();
    }}
            >
              <option value="" ?selected=${u === ""}>${p}</option>
              ${i.map(
      (h) => g`<option value=${h} ?selected=${u === h}>
                    ${this._entityName(h)}
                  </option>`
    )}
            </select>
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Dark threshold (lux)</div>
            <div class="config-help">Dark when lux is below this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min="0"
              step="1"
              class="input"
              .value=${String(l)}
              ?disabled=${_}
              data-testid="ambient-dark-threshold"
              @change=${(h) => {
      const f = Math.max(0, Number(h.target.value) || 0);
      this._setAmbientDraft({
        ...t,
        dark_threshold: f,
        bright_threshold: Math.max(f + 1, Number(t.bright_threshold) || f + 1)
      }), this._scheduleAmbientReadingReload();
    }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Bright threshold (lux)</div>
            <div class="config-help">Bright when lux is above this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min=${String(l + 1)}
              step="1"
              class="input"
              .value=${String(d)}
              ?disabled=${_}
              data-testid="ambient-bright-threshold"
              @change=${(h) => {
      const f = Math.max(
        l + 1,
        Number(h.target.value) || l + 1
      );
      this._setAmbientDraft({
        ...t,
        bright_threshold: f
      }), this._scheduleAmbientReadingReload();
    }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Fallback to sun</div>
            <div class="config-help">Use sunrise/sunset state when no lux sensor reading is available.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.fallback_to_sun}
              ?disabled=${_}
              data-testid="ambient-fallback-to-sun-toggle"
              @change=${(h) => {
      this._setAmbientDraft({
        ...t,
        fallback_to_sun: h.target.checked
      }), this._scheduleAmbientReadingReload();
    }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Assume dark on error</div>
            <div class="config-help">When fallback to sun is disabled, treat unavailable readings as dark.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.assume_dark_on_error}
              ?disabled=${_}
              data-testid="ambient-assume-dark-on-error-toggle"
              @change=${(h) => {
      this._setAmbientDraft({
        ...t,
        assume_dark_on_error: h.target.checked
      }), this._scheduleAmbientReadingReload();
    }}
            />
          </div>
        </div>
      </div>
    `;
  }
  _isManagedShadowHost() {
    if (!this.location || this.location.is_explicit_root) return !1;
    const t = C(this.location);
    return t === "floor" || t === "building" || t === "grounds" || t === "property";
  }
  _currentManagedShadowAreaId() {
    return !this._isManagedShadowHost() || !this.location ? "" : de(this.location);
  }
  _managedShadowAreaById(t) {
    return (this.allLocations || []).find((e) => e.id === t);
  }
  /** See `effectiveOccupancyTopologyId` (shadow host occupancy entity id). */
  _effectiveOccupancyTopologyId() {
    return Je(this.location, this.allLocations);
  }
  _managedShadowAreaLabel(t) {
    var n, o, a;
    const e = this._managedShadowAreaById(t);
    return e ? (e.ha_area_id ? (a = (o = (n = this.hass) == null ? void 0 : n.areas) == null ? void 0 : o[e.ha_area_id]) == null ? void 0 : a.name : void 0) || e.name : t;
  }
  _managedShadowState() {
    var l;
    if (!this._isManagedShadowHost() || !this.location) return;
    const t = this.location.id, e = this._currentManagedShadowAreaId(), i = e ? this._managedShadowAreaById(e) : void 0, n = ((l = i == null ? void 0 : i.modules) == null ? void 0 : l._meta) || {}, o = String(n.role || "").trim().toLowerCase() === "managed_shadow", a = String(n.shadow_for_location_id || "").trim(), r = !!(i && i.ha_area_id && i.parent_id === t && o && a === t), s = [];
    return e && !i && s.push("configured system area was not found"), i && !i.ha_area_id && s.push("location is missing linked HA area id"), i && i.parent_id !== t && s.push(`parent mismatch (expected ${t}, got ${i.parent_id || "root"})`), i && !o && s.push('missing role tag "managed_shadow"'), i && a !== t && s.push(`shadow host mapping mismatch (expected ${t}, got ${a || "unset"})`), {
      hostId: t,
      shadowAreaId: e,
      currentLabel: e ? this._managedShadowAreaLabel(e) : "Not configured",
      isConsistent: r,
      mismatchReasons: s,
      needsRepair: !e || !r
    };
  }
  _maybeAutoRepairManagedShadowArea() {
    const t = this._managedShadowState();
    if (!t || !t.needsRepair || !this.hass || !this.location) return;
    const e = `${this.location.id}:${t.shadowAreaId || "missing"}`;
    this._managedShadowAutoRepairKey === e || this._managedShadowAutoRepairInProgress || (this._managedShadowAutoRepairKey = e, this._managedShadowAutoRepairInProgress = !0, this._runSyncImport({ silent: !0, backgroundRepair: !0 }));
  }
  _renderManagedShadowAreaSection() {
    const t = this._managedShadowState();
    if (!t || !this.location) return "";
    const e = t.mismatchReasons.length ? t.mismatchReasons.join("; ") : "metadata mismatch";
    return g`
      <div class="card-section" data-testid="managed-shadow-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Managed System Area
        </div>
        <div class="policy-note">
          Topomation owns this mapping. Assignments to this ${C(this.location)} are
          remapped to a managed shadow HA area for native area_id interoperability.
        </div>
        <div class="subsection-help">
          Current system area: ${t.currentLabel}
        </div>
        ${this._managedShadowAutoRepairInProgress ? g`
              <div class="policy-note" data-testid="managed-shadow-auto-repair">
                Topomation is reconciling this managed system area automatically.
              </div>
            ` : t.shadowAreaId ? t.isConsistent ? "" : g`
                  <div class="policy-warning" data-testid="managed-shadow-warning">
                    Managed system area mapping is inconsistent for ${t.hostId}: ${e}.
                    Topomation could not repair it automatically. Action: run Sync Import to reconcile metadata.
                  </div>
                ` : g`
                <div class="policy-warning" data-testid="managed-shadow-warning">
                  Missing managed system area mapping for ${t.hostId}. Topomation could not repair it
                  automatically. Action: run Sync Import to create and relink the managed system area.
                </div>
              `}
        ${t.needsRepair && !this._managedShadowAutoRepairInProgress ? g`
              <div class="advanced-toggle-row">
                <button
                  class="button button-secondary"
                  type="button"
                  data-testid="managed-shadow-sync-import"
                  ?disabled=${this._syncImportInProgress || this._managedShadowAutoRepairInProgress}
                  @click=${() => void this._runSyncImport()}
                >
                  ${this._syncImportInProgress ? "Running Sync Import..." : "Run Sync Import"}
                </button>
              </div>
            ` : ""}
      </div>
    `;
  }
  _linkedLocationFloorParentId() {
    if (!this.location || C(this.location) !== "area") return null;
    const t = this.location.parent_id ?? null;
    if (!t) return null;
    const e = (this.allLocations || []).find((i) => i.id === t);
    return !e || C(e) !== "floor" ? null : t;
  }
  _linkedLocationCandidates() {
    if (!this.location) return [];
    const t = this._linkedLocationFloorParentId();
    if (!t) return [];
    const e = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((i) => i.id !== this.location.id).filter((i) => (i.parent_id ?? null) === t).filter((i) => C(i) === "area").filter((i) => !this._isManagedShadowLocation(i, e)).sort((i, n) => i.name.localeCompare(n.name));
  }
  _locationById(t) {
    if (t)
      return (this.allLocations || []).find((e) => e.id === t);
  }
  _isManagedShadowLocation(t, e) {
    return De(t, e);
  }
  _managedShadowLocationIds() {
    return Re(this.allLocations || []);
  }
  _normalizeLinkedLocationIds(t, e, i) {
    if (!Array.isArray(t))
      return [];
    const n = /* @__PURE__ */ new Set(), o = [];
    for (const a of t) {
      if (typeof a != "string") continue;
      const r = a.trim();
      !r || n.has(r) || i && r === i || e && !e.has(r) || (n.add(r), o.push(r));
    }
    return o;
  }
  _linkedLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._linkedLocationCandidates().map((n) => n.id));
    if (e.size === 0)
      return [];
    const i = t.linked_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _candidateLinkedLocationIds(t) {
    const e = this._occupancyConfigForLocation(t).linked_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _candidateOccupancyGroupId(t) {
    const e = this._occupancyConfigForLocation(t).occupancy_group_id;
    return typeof e == "string" && e.trim().length > 0 ? e.trim() : null;
  }
  _occupancyGroupCandidatesForLocation(t) {
    var a;
    const e = this._managedShadowLocationIds(), i = C(t), n = i === "floor" ? t.id : i === "area" ? ((a = this._locationById(t.parent_id ?? null)) == null ? void 0 : a.id) ?? null : null, o = n ? this._locationById(n) : void 0;
    return !o || C(o) !== "floor" ? [] : (this.allLocations || []).filter((r) => r.parent_id === o.id).filter((r) => C(r) === "area").filter((r) => !this._isManagedShadowLocation(r, e)).sort((r, s) => r.name.localeCompare(s.name));
  }
  _occupancyGroupMemberIds(t) {
    var o;
    const e = t === ((o = this.location) == null ? void 0 : o.id) ? this.location : (this.allLocations || []).find((a) => a.id === t);
    if (!e) return [];
    const i = this._candidateOccupancyGroupId(e);
    return i ? this._occupancyGroupCandidatesForLocation(e).filter((a) => this._candidateOccupancyGroupId(a) === i).map((a) => a.id).sort((a, r) => this._locationName(a).localeCompare(this._locationName(r))) : [t];
  }
  _generateOccupancyGroupId() {
    var i;
    const t = ((i = this.location) == null ? void 0 : i.id) || "floor", e = Math.random().toString(36).slice(2, 8);
    return `${t}_group_${Date.now().toString(36)}_${e}`;
  }
  _isTwoWayLinked(t, e) {
    return !this.location || !e.has(t.id) ? !1 : this._candidateLinkedLocationIds(t).includes(this.location.id);
  }
  _toggleLinkedLocation(t, e) {
    const i = this._getOccupancyConfig(), n = new Set(this._linkedLocationIds(i));
    e ? n.add(t) : n.delete(t);
    const o = [...n].sort(
      (a, r) => this._locationName(a).localeCompare(this._locationName(r))
    );
    this._setOccupancyDraft({
      ...i,
      linked_locations: o
    });
  }
  _toggleTwoWayLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this._getOccupancyConfig(), n = new Set(this._linkedLocationIds(i));
    let o = [...n].sort(
      (s, l) => this._locationName(s).localeCompare(this._locationName(l))
    );
    e && !n.has(t.id) && (n.add(t.id), o = [...n].sort(
      (s, l) => this._locationName(s).localeCompare(this._locationName(l))
    ));
    const a = new Set(this._candidateLinkedLocationIds(t));
    e ? a.add(this.location.id) : a.delete(this.location.id);
    const r = [...a].sort(
      (s, l) => this._locationName(s).localeCompare(this._locationName(l))
    );
    this._setOccupancyDraft({
      ...i,
      linked_locations: o
    }), this._setPendingOccupancyForLocation(t.id, {
      ...this._occupancyConfigForLocation(t),
      linked_locations: r
    });
  }
  _renderAreaOccupancyGroupSection(t) {
    if (!this.location) return "";
    const e = this._linkedLocationFloorParentId();
    if (!e)
      return g`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
            Occupancy Group
          </div>
          <div class="subsection-help">
            Occupancy groups are managed from the parent floor.
          </div>
        </div>
      `;
    const i = this._occupancyGroupMemberIds(this.location.id), n = i.filter((a) => a !== this.location.id), o = this._locationName(e);
    return g`
      <div class="card-section" data-testid="occupancy-group-summary-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Occupancy Group
        </div>
        <div class="subsection-help">Managed from ${o}.</div>
        ${n.length === 0 ? g`
              <div class="adjacency-empty">No occupancy group assigned.</div>
            ` : g`
              <div class="linked-location-meta">
                Members: ${i.map((a) => this._locationName(a)).join(", ")}
              </div>
            `}
      </div>
    `;
  }
  _floorGroupAreaCandidates() {
    return !this.location || !this._isFloorLocation() ? [] : this._occupancyGroupCandidatesForLocation(this.location);
  }
  _floorOccupancyGroups() {
    const t = this._floorGroupAreaCandidates();
    if (t.length === 0) return [];
    const e = new Set(t.map((o) => o.id)), i = /* @__PURE__ */ new Set(), n = [];
    for (const o of t) {
      if (i.has(o.id)) continue;
      const a = this._candidateOccupancyGroupId(o);
      if (!a) {
        i.add(o.id);
        continue;
      }
      const r = t.filter((l) => this._candidateOccupancyGroupId(l) === a).map((l) => l.id).filter((l) => e.has(l));
      for (const l of r)
        i.add(l);
      if (r.length <= 1) {
        i.add(o.id);
        continue;
      }
      const s = [...r].sort((l, d) => this._locationName(l).localeCompare(this._locationName(d)));
      n.push({
        id: a,
        memberIds: s
      });
    }
    return n.sort((o, a) => o.memberIds[0].localeCompare(a.memberIds[0]));
  }
  _ungroupedFloorAreaIds() {
    const t = new Set(this._floorOccupancyGroups().flatMap((e) => e.memberIds));
    return this._floorGroupAreaCandidates().map((e) => e.id).filter((e) => !t.has(e));
  }
  _applyFloorOccupancyGroups(t) {
    const e = this._floorGroupAreaCandidates(), i = new Set(e.map((o) => o.id)), n = t.map((o) => ({
      ...o,
      memberIds: [...new Set(o.memberIds.filter((a) => i.has(a)))].sort(
        (a, r) => this._locationName(a).localeCompare(this._locationName(r))
      )
    })).filter((o) => o.memberIds.length > 1);
    for (const o of e) {
      const a = this._occupancyConfigForLocation(o), r = n.find((s) => s.memberIds.includes(o.id));
      this._setPendingOccupancyForLocation(o.id, {
        ...a,
        occupancy_group_id: r ? r.id : null
      });
    }
  }
  _toggleFloorCreateSelection(t, e) {
    const i = new Set(this._floorGroupCreateSelection);
    e ? i.add(t) : i.delete(t), this._floorGroupCreateSelection = [...i].sort(
      (n, o) => this._locationName(n).localeCompare(this._locationName(o))
    ), this.requestUpdate();
  }
  async _persistFloorOccupancyGroups(t, e) {
    if (!this.location || !this.hass) return;
    const i = this._floorGroupAreaCandidates(), n = new Set(i.map((a) => a.id)), o = t.map((a) => ({
      ...a,
      memberIds: [...new Set(a.memberIds.filter((r) => n.has(r)))].sort(
        (r, s) => this._locationName(r).localeCompare(this._locationName(s))
      )
    })).filter((a) => a.memberIds.length > 1);
    this._savingOccupancyDraft = !0, this._occupancySaveError = void 0, this.requestUpdate();
    try {
      for (const a of i) {
        const r = this._persistedOccupancyConfigForLocation(a), s = o.find((d) => d.memberIds.includes(a.id)), l = this._sanitizeOccupancyConfig(
          {
            ...r,
            occupancy_group_id: s ? s.id : null
          },
          a.id
        );
        await this._persistOccupancyConfigForLocation(a.id, l), a.modules = a.modules || {}, a.modules.occupancy = l;
      }
      this._pendingOccupancyByLocation = {}, this._floorGroupCreateSelection = [], this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._detectionDraftHint = void 0, this._showToast(e, "success");
    } catch (a) {
      console.error("Failed to update occupancy groups", a), this._occupancySaveError = (a == null ? void 0 : a.message) || "Failed to update occupancy groups", this._showToast(this._occupancySaveError, "error");
    } finally {
      this._savingOccupancyDraft = !1, this.requestUpdate();
    }
  }
  async _createFloorOccupancyGroup() {
    if (this._savingOccupancyDraft || this._floorGroupCreateSelection.length < 2) return;
    const t = this._floorOccupancyGroups().map((e) => ({
      id: e.id,
      memberIds: [...e.memberIds]
    }));
    t.push({
      id: this._generateOccupancyGroupId(),
      memberIds: [...this._floorGroupCreateSelection]
    }), await this._persistFloorOccupancyGroups(t, "Occupancy group created");
  }
  async _deleteFloorOccupancyGroup(t) {
    if (this._savingOccupancyDraft) return;
    const e = this._floorOccupancyGroups().filter((i) => i.id !== t).map((i) => ({ id: i.id, memberIds: [...i.memberIds] }));
    await this._persistFloorOccupancyGroups(e, "Occupancy group deleted");
  }
  async _toggleFloorGroupMembership(t, e, i) {
    if (this._savingOccupancyDraft) return;
    const n = this._floorOccupancyGroups().map((r) => ({
      ...r,
      memberIds: [...r.memberIds]
    })), o = n.findIndex((r) => r.id === t);
    if (o < 0) return;
    for (const r of n)
      r.id !== t && (r.memberIds = r.memberIds.filter((s) => s !== e));
    const a = n[o];
    i ? a.memberIds.includes(e) || a.memberIds.push(e) : a.memberIds = a.memberIds.filter((r) => r !== e), await this._persistFloorOccupancyGroups(
      n.map((r) => ({ id: r.id, memberIds: r.memberIds })),
      "Occupancy groups updated"
    );
  }
  _renderFloorOccupancyGroupsSection() {
    if (!this.location) return "";
    const t = this._floorGroupAreaCandidates(), e = this._floorOccupancyGroups(), i = this._ungroupedFloorAreaIds(), n = new Set(this._floorGroupCreateSelection.filter((o) => i.includes(o)));
    return g`
      <div class="card-section" data-testid="occupancy-groups-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Occupancy Groups
        </div>
        <div class="subsection-help">
          Create local shared-occupancy groups for this floor. Each area can belong to at most one group.
        </div>
        ${t.length === 0 ? g`<div class="adjacency-empty">No eligible child areas found on this floor.</div>` : g`
              <div class="linked-location-list">
                ${e.length === 0 ? g`<div class="adjacency-empty">No occupancy groups on this floor yet.</div>` : ue(
      e,
      (o) => o.id,
      (o, a) => g`
                        <div class="card-section" data-testid=${`occupancy-group-card-${a + 1}`}>
                          <div class="section-title-row">
                            <div class="subsection-title">Group ${a + 1}</div>
                            <button
                              class="button button-secondary"
                              type="button"
                              data-testid=${`occupancy-group-delete-${a + 1}`}
                              ?disabled=${this._savingOccupancyDraft}
                              @click=${() => void this._deleteFloorOccupancyGroup(o.id)}
                            >
                              Delete group
                            </button>
                          </div>
                          <div class="linked-location-list">
                            ${t.map((r) => {
        const s = o.memberIds.includes(r.id);
        return g`
                                <div class="linked-location-row">
                                  <label class="linked-location-left">
                                    <input
                                      type="checkbox"
                                      data-testid=${`occupancy-group-${a + 1}-location-${r.id}`}
                                      .checked=${s}
                                      ?disabled=${this._savingOccupancyDraft}
                                      @change=${(l) => {
          const d = l.target;
          this._toggleFloorGroupMembership(
            o.id,
            r.id,
            d.checked
          );
        }}
                                    />
                                    <span class="linked-location-name">${r.name}</span>
                                  </label>
                                </div>
                              `;
      })}
                          </div>
                        </div>
                      `
    )}
              </div>
              <div class="card-section" data-testid="occupancy-group-create">
                <div class="subsection-title">Create group</div>
                <div class="subsection-help">
                  Select two or more ungrouped areas to create another occupancy group.
                </div>
                ${i.length === 0 ? g`<div class="adjacency-empty">No ungrouped areas remain on this floor.</div>` : i.length === 1 ? g`<div class="adjacency-empty">Only one ungrouped area remains, so a new group cannot be created.</div>` : g`
                      <div class="linked-location-list">
                        ${i.map((o) => g`
                          <div class="linked-location-row">
                            <label class="linked-location-left">
                              <input
                                type="checkbox"
                                data-testid=${`occupancy-group-create-location-${o}`}
                                .checked=${n.has(o)}
                                ?disabled=${this._savingOccupancyDraft}
                                @change=${(a) => {
      const r = a.target;
      this._toggleFloorCreateSelection(o, r.checked);
    }}
                              />
                              <span class="linked-location-name">${this._locationName(o)}</span>
                            </label>
                          </div>
                        `)}
                      </div>
                      <div class="advanced-toggle-row">
                        ${this._savingOccupancyDraft ? g`<div class="subsection-help">Saving occupancy groups...</div>` : ""}
                        <button
                          class="button button-secondary group-create-button ${n.size >= 2 ? "is-ready" : ""}"
                          type="button"
                          data-testid="occupancy-group-create-button"
                          ?disabled=${this._savingOccupancyDraft || n.size < 2 || i.length < 2}
                          @click=${() => void this._createFloorOccupancyGroup()}
                        >
                          Create group
                        </button>
                      </div>
                    `}
              </div>
            `}
      </div>
    `;
  }
  _renderLinkedLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return g`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
            Directional Contributors
          </div>
          <div class="subsection-help">
            Directional contributors are available only for area locations directly under a floor.
          </div>
        </div>
      `;
    const i = this._linkedLocationCandidates(), n = this._linkedLocationIds(t), o = new Set(n), a = n.length ? n.map((r) => this._locationName(r)).join(", ") : "None";
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Directional Contributors
        </div>
        <div class="subsection-help">
          Advanced: select locations that can contribute occupancy to this location directionally.
          Configure reverse direction from the other location if needed.
        </div>
        <div class="linked-location-meta">Contributors: ${a}</div>
        ${i.length === 0 ? g`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : g`
              <div class="linked-location-list">
                ${i.map((r) => {
      const s = o.has(r.id), l = this._isTwoWayLinked(r, o);
      return g`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-${r.id}`}
                          .checked=${s}
                          @change=${(d) => {
        const u = d.target;
        this._toggleLinkedLocation(r.id, u.checked);
      }}
                        />
                        <span class="linked-location-name">${r.name}</span>
                      </label>
                      <label class="linked-location-right">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-two-way-${r.id}`}
                          .checked=${l}
                          ?disabled=${!s}
                          @change=${(d) => {
        const u = d.target;
        this._toggleTwoWayLinkedLocation(r, u.checked);
      }}
                        />
                        <span class="linked-location-two-way-label">2-way</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _adjacencyCandidates() {
    if (!this.location) return [];
    const t = C(this.location);
    if (t !== "area" && t !== "subarea")
      return [];
    const e = this.location.parent_id ?? null, i = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((n) => n.id !== this.location.id).filter((n) => (n.parent_id ?? null) === e).filter((n) => !this._isManagedShadowLocation(n, i)).filter((n) => {
      const o = C(n);
      return o === "area" || o === "subarea";
    }).sort((n, o) => n.name.localeCompare(o.name));
  }
  _connectedAdjacencyEdges() {
    if (!this.location) return [];
    const t = this.location.id;
    return (this.adjacencyEdges || []).filter(
      (e) => e && (e.from_location_id === t || e.to_location_id === t)
    ).sort((e, i) => {
      const n = this._adjacentLocationName(e), o = this._adjacentLocationName(i);
      return n.localeCompare(o);
    });
  }
  _adjacentLocationId(t) {
    return this.location ? t.from_location_id === this.location.id ? t.to_location_id : t.from_location_id : t.to_location_id;
  }
  _adjacentLocationName(t) {
    var i;
    const e = this._adjacentLocationId(t);
    return ((i = this.allLocations.find((n) => n.id === e)) == null ? void 0 : i.name) || e;
  }
  _edgeDirectionLabel(t) {
    if (!this.location) return t.directionality;
    if (t.directionality === "bidirectional") return "Two-way";
    const e = this.location.id;
    return t.directionality === "a_to_b" && t.from_location_id === e || t.directionality === "b_to_a" && t.to_location_id === e ? "Outbound" : "Inbound";
  }
  _parseCrossingSources(t) {
    return t.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
  }
  _emitAdjacencyChanged() {
    this.dispatchEvent(
      new CustomEvent("adjacency-changed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _handleAdjacencyCreate() {
    var e;
    const t = this._adjacencyNeighborId || ((e = this._adjacencyCandidates()[0]) == null ? void 0 : e.id) || "";
    if (!(!this.location || !t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        let i = this.location.id, n = t, o = "bidirectional";
        this._adjacencyDirection === "outbound" ? o = "a_to_b" : this._adjacencyDirection === "inbound" && (i = t, n = this.location.id, o = "a_to_b"), await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/create",
            from_location_id: i,
            to_location_id: n,
            directionality: o,
            boundary_type: this._adjacencyBoundaryType,
            crossing_sources: this._parseCrossingSources(this._adjacencyCrossingSources),
            handoff_window_sec: this._adjacencyHandoffWindowSec,
            priority: this._adjacencyPriority
          })
        ), this._adjacencyCrossingSources = "", this._showToast("Adjacency edge created", "success"), this._emitAdjacencyChanged();
      } catch (i) {
        console.error("Failed to create adjacency edge:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to create adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  async _handleAdjacencyDelete(t) {
    if (!(!t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/delete",
            edge_id: t
          })
        ), this._showToast("Adjacency edge deleted", "success"), this._emitAdjacencyChanged();
      } catch (e) {
        console.error("Failed to delete adjacency edge:", e), this._showToast((e == null ? void 0 : e.message) || "Failed to delete adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  _renderAdjacencySection() {
    var a;
    if (!this.location) return "";
    const t = this._adjacencyCandidates(), e = this._connectedAdjacencyEdges(), i = this._adjacencyNeighborId || ((a = t[0]) == null ? void 0 : a.id) || "", n = !!i && !this._savingAdjacency, o = t.length === 0;
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:graph-outline"}></ha-icon>
          Adjacent Locations
        </div>
        <div class="subsection-help">
          Model pathways between neighboring locations so wasp-in-box handoffs can reason about movement.
        </div>

        ${e.length === 0 ? g`<div class="adjacency-empty">No adjacency edges for this location yet.</div>` : g`
              <div class="adjacency-list">
                ${e.map((r) => g`
                  <div class="adjacency-row">
                    <div class="adjacency-row-head">
                      <div class="adjacency-neighbor">${this._adjacentLocationName(r)}</div>
                      <button
                        class="button button-secondary adjacency-delete-btn"
                        ?disabled=${this._savingAdjacency}
                        @click=${() => this._handleAdjacencyDelete(r.edge_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div class="adjacency-meta">
                      ${this._edgeDirectionLabel(r)} • ${r.boundary_type} •
                      handoff ${r.handoff_window_sec}s • priority ${r.priority}
                    </div>
                    ${Array.isArray(r.crossing_sources) && r.crossing_sources.length > 0 ? g`
                          <div class="adjacency-meta">
                            crossings: ${r.crossing_sources.join(", ")}
                          </div>
                        ` : ""}
                  </div>
                `)}
              </div>
            `}

        <div class="adjacency-form">
          <div class="adjacency-form-grid">
            <div class="adjacency-form-field">
              <label for="adjacency-neighbor">Neighbor</label>
                <select
                id="adjacency-neighbor"
                .value=${i}
                ?disabled=${o || this._savingAdjacency}
                @change=${(r) => {
      const s = r.target;
      this._adjacencyNeighborId = s.value;
    }}
              >
                ${t.map((r) => g`
                  <option value=${r.id}>${r.name}</option>
                `)}
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-direction">Direction</label>
              <select
                id="adjacency-direction"
                .value=${this._adjacencyDirection}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const s = r.target;
      this._adjacencyDirection = s.value;
    }}
              >
                <option value="bidirectional">Two-way</option>
                <option value="outbound">This to neighbor</option>
                <option value="inbound">Neighbor to this</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-boundary">Boundary</label>
              <select
                id="adjacency-boundary"
                .value=${this._adjacencyBoundaryType}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const s = r.target;
      this._adjacencyBoundaryType = s.value;
    }}
              >
                <option value="door">Door</option>
                <option value="archway">Archway</option>
                <option value="corridor">Corridor</option>
                <option value="stairs">Stairs</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-handoff">Handoff Window (sec)</label>
              <input
                id="adjacency-handoff"
                type="number"
                min="1"
                max="300"
                .value=${String(this._adjacencyHandoffWindowSec)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const s = r.target, l = Number.parseInt(s.value || "12", 10);
      this._adjacencyHandoffWindowSec = Number.isNaN(l) ? 12 : Math.max(1, Math.min(300, l));
    }}
              />
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-priority">Priority</label>
              <input
                id="adjacency-priority"
                type="number"
                min="0"
                max="1000"
                .value=${String(this._adjacencyPriority)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const s = r.target, l = Number.parseInt(s.value || "50", 10);
      this._adjacencyPriority = Number.isNaN(l) ? 50 : Math.max(0, Math.min(1e3, l));
    }}
              />
            </div>
          </div>
          <div class="adjacency-form-field">
            <label for="adjacency-crossings">Crossing sources (comma-separated entity IDs)</label>
            <input
              id="adjacency-crossings"
              type="text"
              placeholder="binary_sensor.hallway_beam, binary_sensor.kitchen_door"
              .value=${this._adjacencyCrossingSources}
              ?disabled=${this._savingAdjacency}
              @input=${(r) => {
      const s = r.target;
      this._adjacencyCrossingSources = s.value;
    }}
            />
          </div>
          <div class="adjacency-form-actions">
            <button
              class="button button-primary"
              ?disabled=${!n || o}
              @click=${this._handleAdjacencyCreate}
            >
              Add Adjacency
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _locationName(t) {
    var e, i;
    return ((e = this.location) == null ? void 0 : e.id) === t ? this.location.name : ((i = this.allLocations.find((n) => n.id === t)) == null ? void 0 : i.name) || t;
  }
  _formatHandoffStatus(t) {
    const e = t.trim();
    return e ? e.split("_").filter((i) => i.length > 0).map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(" ") : "Unknown";
  }
  _renderHandoffTraceSection() {
    if (!this.location) return "";
    const t = Array.isArray(this.handoffTraces) ? this.handoffTraces : [];
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:swap-horizontal-bold"}></ha-icon>
          Handoff Trace
        </div>
        <div class="subsection-help">
          Recent adjacency handoff triggers touching this location. Use this to validate wasp-in-box
          movement assumptions and crossing-source tuning.
        </div>
        ${t.length === 0 ? g`<div class="adjacency-empty">No recent handoff traces for this location.</div>` : g`
              <div class="handoff-trace-list">
                ${t.map((e) => {
      const i = this._parseDateValue(e.timestamp), n = i ? this._formatDateTime(i) : e.timestamp, o = `${this._locationName(e.from_location_id)} -> ${this._locationName(e.to_location_id)}`, a = e.trigger_entity_id || e.trigger_source_id || "unknown";
      return g`
                    <div class="handoff-trace-row">
                      <div class="handoff-trace-head">
                        <span class="handoff-trace-route">${o}</span>
                        <span class="handoff-trace-time">${n}</span>
                      </div>
                      <div class="handoff-trace-meta">
                        ${this._formatHandoffStatus(e.status)} • ${e.boundary_type} • window
                        ${e.handoff_window_sec}s
                      </div>
                      <div class="handoff-trace-meta">trigger: ${a}</div>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState(), i = this._isStructuralSummaryLocation() ? this._aggregateOccupiedStateForStructural() : this._resolveOccupiedState(e);
    if (!e && i === void 0)
      return g`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? g`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const n = (e == null ? void 0 : e.attributes) || {}, o = i === !0, a = this._resolveVacantAt(n, o), r = i === !0 ? "Occupied" : i === !1 ? "Vacant" : "Unknown", s = o ? this._formatVacantAtLabel(a) : "-";
    return g`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${o ? "occupied" : "vacant"}">${r}</span>
          ${t.isLocked ? g`<span class="status-chip locked">Locked</span>` : g`<span class="header-lock-state">Unlocked</span>`}
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
    return t === "color" ? "Color changes" : t === "power" ? "Power changes" : t === "level" ? "Brightness changes" : t === "volume" ? "Volume changes" : t === "mute" ? "Mute changes" : "Playback";
  }
  _signalDescription(t) {
    return t === "color" ? "RGB/color changes" : t === "power" ? "on/off" : t === "level" ? "brightness changes" : t === "volume" ? "volume changes" : t === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(t, e) {
    return e ? `${t}::${e}` : t;
  }
  _sourceKeyFromSource(t) {
    const e = this._normalizedSignalKeyForSource(t);
    return this._sourceKey(t.entity_id, e);
  }
  _sourceCardGroupKey(t) {
    const e = this._normalizedSignalKey(t.entityId, t.signalKey);
    return t.entityId.startsWith("light.") && (e === "power" || e === "level" || e === "color") ? `${t.entityId}::power-level` : t.entityId.startsWith("media_player.") && (e === "playback" || e === "volume" || e === "mute") ? `${t.entityId}::media-signals` : t.key;
  }
  _isLightSignalKey(t) {
    return t === "power" || t === "level" || t === "color";
  }
  _isMediaSignalKey(t) {
    return t === "playback" || t === "volume" || t === "mute";
  }
  _isIntegratedLightGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("light.") && t.every((e) => e.entityId === t[0].entityId);
  }
  _isIntegratedMediaGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("media_player.") && t.every((e) => e.entityId === t[0].entityId);
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
      const n = ["power"];
      return e && n.push("level"), i && n.push("color"), n.map((o) => ({
        key: this._sourceKey(t, o),
        entityId: t,
        signalKey: o
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
    const i = this._normalizedSignalKey(t, e), n = this._entityName(t);
    return i && (t.startsWith("media_player.") || t.startsWith("light.")) ? `${n} — ${this._mediaSignalLabel(i)}` : !this._isMediaEntity(t) && !this._isDimmableEntity(t) && !this._isColorCapableEntity(t) ? n : `${n} — ${this._mediaSignalLabel(i)}`;
  }
  _normalizedSignalKeyForSource(t) {
    var n;
    const e = (n = t.source_id) != null && n.includes("::") ? t.source_id.split("::")[1] : void 0, i = t.signal_key || e;
    return this._normalizedSignalKey(t.entity_id, i);
  }
  _normalizedSignalKey(t, e) {
    return e || this._defaultSignalKeyForEntity(t);
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
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (typeof n.brightness == "number") return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((s) => s && s !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (n.rgb_color || n.hs_color || n.xy_color) return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((s) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(s)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), n = /* @__PURE__ */ new Map();
    i.forEach((f, m) => n.set(this._sourceKeyFromSource(f), m));
    const o = new Set(this.location.entity_ids || []);
    if (this.location.ha_area_id)
      for (const f of this._entitiesForArea(this.location.ha_area_id))
        o.add(f);
    const s = [...o].sort(
      (f, m) => this._entityName(f).localeCompare(this._entityName(m))
    ).filter((f) => this._isCoreAreaSourceEntity(f)).flatMap(
      (f) => this._candidateItemsForEntity(f)
    ), l = s, d = new Set(s.map((f) => f.key)), u = i.filter((f) => !d.has(this._sourceKeyFromSource(f))).map((f) => ({
      key: this._sourceKeyFromSource(f),
      entityId: f.entity_id,
      signalKey: this._normalizedSignalKeyForSource(f)
    })), p = [...l, ...u].sort((f, m) => {
      const v = this._entityName(f.entityId).localeCompare(this._entityName(m.entityId));
      if (v !== 0) return v;
      const $ = this._signalSortWeight(f.signalKey) - this._signalSortWeight(m.signalKey);
      if ($ !== 0) return $;
      const k = n.get(f.key), b = n.get(m.key);
      return k !== void 0 && b !== void 0 ? k - b : k !== void 0 ? -1 : b !== void 0 ? 1 : 0;
    }), _ = [], h = /* @__PURE__ */ new Map();
    for (const f of p) {
      const m = this._sourceCardGroupKey(f), v = h.get(m);
      if (v) {
        v.items.push(f);
        continue;
      }
      const $ = { key: m, items: [f] };
      h.set(m, $), _.push($);
    }
    return _.length ? g`
      <div class="candidate-list">
        ${ue(_, (f) => f.key, (f) => {
      if (this._isIntegratedLightGroup(f.items))
        return this._renderIntegratedLightCard(t, f.items, i, n);
      if (this._isIntegratedMediaGroup(f.items))
        return this._renderIntegratedMediaCard(t, f.items, i, n);
      const m = f.items.some((v) => n.has(v.key));
      return g`
            <div class="source-card ${m ? "enabled" : ""}">
              ${ue(f.items, (v) => v.key, (v, $) => {
        const k = n.get(v.key), b = k !== void 0, M = b ? i[k] : void 0, F = b && M ? M : void 0, D = this._modeOptionsForEntity(v.entityId);
        return g`
                  <div class=${`source-card-item${$ > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${b}
                          @change=${(R) => {
          const E = R.target.checked;
          E && !b ? this._addSourceWithDefaults(v.entityId, t, {
            resetExternalPicker: !1,
            signalKey: v.signalKey
          }) || this.requestUpdate() : !E && b && this._removeSource(k, t);
        }}
                        />
                      </div>
                      <div>
                        <div class="candidate-headline">
                          <div class="candidate-title">
                            ${this._candidateTitle(v.entityId, v.signalKey)}
                            <span class="candidate-entity-inline">[${v.entityId}]</span>
                          </div>
                          <div class="candidate-controls">
                            <span class="source-state-pill">${this._entityState(v.entityId)}</span>
                            ${b && F && D.length > 1 ? g`
                                  <div class="inline-mode-group">
                                    <span class="inline-mode-label">Mode</span>
                                    <select
                                      class="inline-mode-select"
                                      .value=${D.some((R) => R.value === F.mode) ? F.mode : D[0].value}
                                      @change=${(R) => {
          const E = R.target.value, H = this.hass.states[v.entityId], X = qe(F, E, H);
          this._updateSourceDraft(t, k, { ...X, entity_id: F.entity_id });
        }}
                                    >
                                      ${D.map((R) => g`<option value=${R.value}>${R.label}</option>`)}
                                    </select>
                                  </div>
                                ` : ""}
                          </div>
                        </div>
                        ${(this._isMediaEntity(v.entityId) || v.entityId.startsWith("light.")) && v.signalKey ? g`<div class="candidate-submeta">Activity trigger: ${this._mediaSignalLabel(v.signalKey)}</div>` : ""}
                      </div>
                    </div>
                    ${b && M ? this._renderSourceEditor(t, M, k) : ""}
                  </div>
                `;
      })}
            </div>
          `;
    })}
      </div>
    ` : g`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? g`No occupancy-relevant entities found yet. Add one from another area to get started.` : g`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderIntegratedLightCard(t, e, i, n) {
    var _;
    const o = (_ = e[0]) == null ? void 0 : _.entityId;
    if (!o) return "";
    const a = [...e].filter((h) => this._isLightSignalKey(h.signalKey)).sort((h, f) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(f.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((h) => n.has(h.key)), s = r.length > 0, l = r.find((h) => h.signalKey === "power") || r[0] || a[0], d = n.get(l.key), u = d !== void 0 ? i[d] : void 0, p = this._modeOptionsForEntity(o);
    return g`
      <div class="source-card ${s ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include light source"
                .checked=${s}
                @change=${(h) => {
      var m;
      const f = h.target.checked;
      if (f && !s) {
        const v = ((m = a.find((k) => k.signalKey === "power")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !f && s && this._removeSourcesByKey(
        a.map((v) => v.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(o)}
                  <span class="candidate-entity-inline">[${o}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(o)}</span>
                  ${u && d !== void 0 && p.length > 1 ? g`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === u.mode) ? u.mode : p[0].value}
                            @change=${(h) => {
      const f = h.target.value, m = this.hass.states[o], v = qe(u, f, m);
      this._updateSourceDraft(t, d, {
        ...v,
        entity_id: u.entity_id
      });
    }}
                          >
                            ${p.map((h) => g`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const f = n.has(h.key);
      return g`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${f}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !f) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && f && this._removeSourcesByKey([h.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(h.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${u && d !== void 0 ? this._renderSourceEditor(t, u, d) : ""}
        </div>
      </div>
    `;
  }
  _renderIntegratedMediaCard(t, e, i, n) {
    var _;
    const o = (_ = e[0]) == null ? void 0 : _.entityId;
    if (!o) return "";
    const a = [...e].filter((h) => this._isMediaSignalKey(h.signalKey)).sort((h, f) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(f.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((h) => n.has(h.key)), s = r.length > 0, l = r.find((h) => h.signalKey === "playback") || r[0] || a[0], d = n.get(l.key), u = d !== void 0 ? i[d] : void 0, p = this._modeOptionsForEntity(o);
    return g`
      <div class="source-card ${s ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include media source"
                .checked=${s}
                @change=${(h) => {
      var m;
      const f = h.target.checked;
      if (f && !s) {
        const v = ((m = a.find((k) => k.signalKey === "playback")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !f && s && this._removeSourcesByKey(
        a.map((v) => v.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(o)}
                  <span class="candidate-entity-inline">[${o}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(o)}</span>
                  ${u && d !== void 0 && p.length > 1 ? g`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === u.mode) ? u.mode : p[0].value}
                            @change=${(h) => {
      const f = h.target.value, m = this.hass.states[o], v = qe(u, f, m);
      this._updateSourceDraft(t, d, {
        ...v,
        entity_id: u.entity_id
      });
    }}
                          >
                            ${p.map((h) => g`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const f = n.has(h.key);
      return g`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${f}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !f) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && f && this._removeSourcesByKey([h.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(h.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${u && d !== void 0 ? this._renderSourceEditor(t, u, d) : ""}
        </div>
      </div>
    `;
  }
  _renderExternalSourceComposer(t) {
    var p, _;
    const e = this._availableSourceAreas(), i = this._isSiblingAreaSourceScope(), n = ((p = this.location) == null ? void 0 : p.ha_area_id) || "", o = !!n, a = this._externalAreaId || "", r = a ? a === "__this_area__" ? n ? this._entitiesForArea(n) : [] : this._entitiesForArea(a) : [], s = new Set(this._workingSources(t).map((h) => this._sourceKeyFromSource(h))), l = this._externalEntityId || "", d = i ? "Sibling Area" : (_ = this.location) != null && _.ha_area_id ? "Other Area" : "Source Area", u = i ? "Select sibling area..." : "Select area...";
    return g`
      <div class="external-composer is-dialog">
        ${i ? g`<div class="runtime-note">Sibling areas on this floor are available, plus all compatible entities in this area.</div>` : ""}
        ${i && e.length === 0 ? g`
              <div class="policy-warning">
                No sibling HA-backed areas are available for cross-area sources.
              </div>
            ` : ""}
        <div class="editor-field">
          <label for="external-source-area">${d}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${a}
            @change=${(h) => {
      const f = h.target.value;
      this._externalAreaId = f, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">${u}</option>
            ${o ? g`<option value="__this_area__">This area (all compatible)</option>` : ""}
            ${i ? "" : g`<option value="__all__">Any area / unassigned</option>`}
            ${e.map((h) => g`<option value=${h.area_id}>${h.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${l}
            @change=${(h) => {
      this._externalEntityId = h.target.value, this.requestUpdate();
    }}
            ?disabled=${!a}
          >
            <option value="">Select sensor...</option>
            ${r.map((h) => g`
              <option
                value=${h}
                ?disabled=${s.has(this._sourceKey(h, this._defaultSignalKeyForEntity(h)))}
              >
                ${this._entityName(h)}${s.has(this._sourceKey(h, this._defaultSignalKeyForEntity(h))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  }
  _renderExternalSourceDialog() {
    if (!this._externalSourceDialogOpen || !this.location) return "";
    const t = this._getOccupancyConfig(), e = this._isSiblingAreaSourceScope(), i = !!this.location.ha_area_id;
    return g`
      <ha-dialog
        .open=${this._externalSourceDialogOpen}
        .heading=${"Add Source"}
        data-testid="external-source-dialog"
        @closed=${() => this._closeExternalSourceDialog()}
      >
        <div class="external-source-dialog-content">
          <div class="external-source-dialog-copy">
            ${i ? e ? "Add another occupancy contributor from a sibling area or include another compatible entity from this area." : "Add another occupancy contributor from another area or include another compatible entity from this area." : "Add another occupancy contributor from any Home Assistant area, including unassigned entities."}
          </div>
          ${this._renderExternalSourceComposer(t)}
        </div>
        <button
          slot="secondaryAction"
          class="button button-secondary"
          type="button"
          data-testid="close-external-source-dialog"
          @click=${() => this._closeExternalSourceDialog()}
        >
          Cancel
        </button>
        <button
          slot="primaryAction"
          class="button button-primary"
          type="button"
          data-testid="confirm-add-external-source"
          ?disabled=${this._savingOccupancyDraft || !this._canAddSelectedExternalSource(t)}
          @click=${() => this._confirmExternalSourceSelection(t)}
        >
          Add Source
        </button>
      </ha-dialog>
    `;
  }
  _renderWiabSection(t) {
    var d, u, p, _;
    const e = this._getWiabConfig(t), i = this._wiabInteriorCandidates(), n = this._wiabDoorCandidates(), o = ((d = this.location) == null ? void 0 : d.ha_area_id) || "", a = o ? ((_ = (p = (u = this.hass) == null ? void 0 : u.areas) == null ? void 0 : p[o]) == null ? void 0 : _.name) || o : "", r = !!o && !this._wiabShowAllEntities, s = e.preset || "off";
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:box-shadow"}></ha-icon>
          Wasp In A Box
        </div>
        <div class="subsection-help">
          Preset occupancy latch behavior for enclosed rooms and whole-home containment.
          Use this when boundary sensors should hold occupancy until a release event occurs.
        </div>

        <div class="wiab-config">
          <div class="editor-field" style="max-width: 420px;">
            <label for="wiab-preset">Preset</label>
            <select
              id="wiab-preset"
              data-testid="wiab-preset-select"
              .value=${s}
              @change=${(h) => {
      const f = this._normalizeWiabPreset(
        h.target.value
      ), m = this._defaultWiabTimeouts(f);
      this._setOccupancyDraft({
        ...t,
        wiab: {
          ...e,
          preset: f,
          hold_timeout_sec: m.hold_timeout_sec,
          release_timeout_sec: m.release_timeout_sec
        }
      });
    }}
            >
              <option value="off">Off</option>
              <option value="enclosed_room">Enclosed Room (Door Latch)</option>
              <option value="home_containment">Home Containment</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          ${s === "off" ? g`<div class="policy-note">WIAB is disabled for this location.</div>` : g`<div class="policy-note">Active preset: ${s === "enclosed_room" ? "Enclosed Room (Door Latch)" : s === "home_containment" ? "Home Containment" : s === "hybrid" ? "Hybrid" : "Off"}</div>`}

          ${s === "off" ? "" : g`
                ${o ? g`
                      <label class="editor-toggle">
                        <input
                          type="checkbox"
                          data-testid="wiab-show-all-toggle"
                          .checked=${this._wiabShowAllEntities}
                          @change=${(h) => {
      this._wiabShowAllEntities = h.target.checked;
    }}
                        />
                        Show entities from all areas
                      </label>
                      <div class="policy-note">
                        ${r ? `Showing ${a} entities by default.` : "Showing entities from all areas."}
                      </div>
                    ` : ""}

                ${this._renderWiabEntityEditor({
      label: "Interior entities",
      listKey: "interior_entities",
      candidates: i,
      selectedEntityId: this._wiabInteriorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabInteriorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-interior"
    })}

                ${s === "enclosed_room" || s === "hybrid" ? this._renderWiabEntityEditor({
      label: "Boundary door entities",
      listKey: "door_entities",
      candidates: n,
      selectedEntityId: this._wiabDoorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabDoorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-door"
    }) : ""}

                ${s === "home_containment" || s === "hybrid" ? this._renderWiabEntityEditor({
      label: "Exterior door entities",
      listKey: "exterior_door_entities",
      candidates: n,
      selectedEntityId: this._wiabExteriorDoorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabExteriorDoorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-exterior-door"
    }) : ""}

                <div class="wiab-grid">
                  <div class="editor-field">
                    <label for="wiab-hold-timeout">Hold timeout (sec)</label>
                    <input
                      id="wiab-hold-timeout"
                      data-testid="wiab-hold-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.hold_timeout_sec ?? 0)}
                      @change=${(h) => {
      const f = Number(h.target.value);
      this._updateWiabValue(t, "hold_timeout_sec", f);
    }}
                    />
                  </div>
                  <div class="editor-field">
                    <label for="wiab-release-timeout">Release timeout (sec)</label>
                    <input
                      id="wiab-release-timeout"
                      data-testid="wiab-release-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.release_timeout_sec ?? 0)}
                      @change=${(h) => {
      const f = Number(h.target.value);
      this._updateWiabValue(t, "release_timeout_sec", f);
    }}
                    />
                  </div>
                </div>
              `}
        </div>
      </div>
    `;
  }
  _renderWiabEntityEditor(t) {
    const i = this._getWiabConfig(t.config)[t.listKey] || [], n = new Set(i), o = t.candidates.filter((r) => !n.has(r)), a = n.has(t.selectedEntityId) ? "" : t.selectedEntityId;
    return g`
      <div class="wiab-entity-editor">
        <label>${t.label}</label>
        <div class="wiab-entity-input">
          <select
            data-testid=${`${t.testIdPrefix}-select`}
            .value=${a}
            @change=${(r) => {
      t.setSelectedEntityId(r.target.value), this.requestUpdate();
    }}
          >
            <option value="">Select entity...</option>
            ${o.map((r) => g`
              <option value=${r}>${this._entityName(r)} (${r})</option>
            `)}
          </select>
          <button
            class="button button-secondary"
            data-testid=${`${t.testIdPrefix}-add`}
            ?disabled=${!a}
            @click=${() => {
      this._addWiabEntity(t.config, t.listKey, a) && (t.setSelectedEntityId(""), this.requestUpdate());
    }}
          >
            Add
          </button>
        </div>

        ${i.length === 0 ? g`<div class="wiab-empty">No entities configured.</div>` : g`
              <div class="wiab-chip-list">
                ${i.map((r) => g`
                  <span class="wiab-chip" data-testid=${`${t.testIdPrefix}-chip`}>
                    ${this._entityName(r)}
                    <button
                      type="button"
                      aria-label="Remove entity"
                      data-testid=${`${t.testIdPrefix}-remove`}
                      @click=${() => this._removeWiabEntity(t.config, t.listKey, r)}
                    >
                      ×
                    </button>
                  </span>
                `)}
              </div>
            `}
      </div>
    `;
  }
  _getWiabConfig(t) {
    const e = t.wiab || {}, i = this._normalizeWiabPreset(e.preset), n = this._defaultWiabTimeouts(i);
    return {
      preset: i,
      interior_entities: this._normalizeWiabEntities(e.interior_entities),
      door_entities: this._normalizeWiabEntities(e.door_entities),
      exterior_door_entities: this._normalizeWiabEntities(e.exterior_door_entities),
      hold_timeout_sec: this._clampWiabSeconds(e.hold_timeout_sec, n.hold_timeout_sec),
      release_timeout_sec: this._clampWiabSeconds(e.release_timeout_sec, n.release_timeout_sec)
    };
  }
  _normalizeWiabPreset(t) {
    const e = String(t || "").trim().toLowerCase();
    return e === "enclosed_room" ? "enclosed_room" : e === "home_containment" ? "home_containment" : e === "hybrid" ? "hybrid" : "off";
  }
  _defaultWiabTimeouts(t) {
    return t === "home_containment" ? { hold_timeout_sec: 3600, release_timeout_sec: 120 } : t === "hybrid" ? { hold_timeout_sec: 1800, release_timeout_sec: 120 } : { hold_timeout_sec: 900, release_timeout_sec: 90 };
  }
  _normalizeWiabEntities(t) {
    if (!Array.isArray(t)) return [];
    const e = /* @__PURE__ */ new Set(), i = [];
    for (const n of t) {
      if (typeof n != "string") continue;
      const o = n.trim();
      !o || e.has(o) || (e.add(o), i.push(o));
    }
    return i;
  }
  _clampWiabSeconds(t, e) {
    const i = Number.parseInt(String(t ?? e), 10);
    return Number.isNaN(i) ? e : Math.max(0, Math.min(86400, i));
  }
  _updateWiabValue(t, e, i) {
    const n = this._getWiabConfig(t), o = n[e] ?? this._defaultWiabTimeouts(n.preset || "off")[e], a = this._clampWiabSeconds(i, o);
    this._setOccupancyDraft({
      ...t,
      wiab: {
        ...n,
        [e]: a
      }
    });
  }
  _addWiabEntity(t, e, i) {
    const n = i.trim();
    if (!n) return !1;
    const o = this._getWiabConfig(t), a = o[e] || [];
    return a.includes(n) ? !1 : (this._setOccupancyDraft({
      ...t,
      wiab: {
        ...o,
        [e]: [...a, n]
      }
    }), !0);
  }
  _removeWiabEntity(t, e, i) {
    const n = this._getWiabConfig(t), o = n[e] || [], a = o.filter((r) => r !== i);
    a.length !== o.length && this._setOccupancyDraft({
      ...t,
      wiab: {
        ...n,
        [e]: a
      }
    });
  }
  _wiabInteriorCandidates() {
    return this._wiabCandidates((t) => this._isCandidateEntity(t));
  }
  _wiabDoorCandidates() {
    return this._wiabCandidates((t) => this._isDoorBoundaryEntity(t));
  }
  _wiabCandidates(t) {
    var o, a;
    const e = ((o = this.hass) == null ? void 0 : o.states) || {}, i = (a = this.location) == null ? void 0 : a.ha_area_id;
    return (i && !this._wiabShowAllEntities ? this._wiabEntityIdsForArea(i) : Object.keys(e)).filter((r) => this._isCandidateEntity(r)).filter(t).sort((r, s) => this._entityName(r).localeCompare(this._entityName(s)));
  }
  _wiabEntityIdsForArea(t) {
    var n, o;
    const e = ((n = this.hass) == null ? void 0 : n.states) || {}, i = /* @__PURE__ */ new Set();
    for (const a of ((o = this.location) == null ? void 0 : o.entity_ids) || [])
      e[a] && i.add(a);
    for (const a of Object.keys(e))
      this._entityIsInArea(a, t) && i.add(a);
    return [...i];
  }
  _entityIsInArea(t, e) {
    return this._resolveEntityAreaId(t) === e;
  }
  _resolveEntityAreaId(t, e) {
    var a, r, s;
    const i = this._entityAreaById[t];
    if (typeof i == "string" && i.trim())
      return i;
    const n = e ?? ((r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t]), o = (s = n == null ? void 0 : n.attributes) == null ? void 0 : s.area_id;
    return typeof o == "string" && o.trim() ? o : null;
  }
  _isDoorBoundaryEntity(t) {
    var a, r, s;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory || t.split(".", 1)[0] !== "binary_sensor") return !1;
    const o = String(((s = e.attributes) == null ? void 0 : s.device_class) || "").toLowerCase();
    return ["door", "garage_door", "opening", "window"].includes(o);
  }
  _renderSourceEditor(t, e, i) {
    const n = e, o = this._eventLabelsForSource(e), a = this._sourceKeyFromSource(e), r = this._supportsOffBehavior(e), s = this._isStateHeldPresenceSource(n), l = t.default_timeout || 300, d = this._onTimeoutMemory[a], u = n.on_timeout === null ? d ?? l : n.on_timeout ?? d ?? l, p = Math.max(1, Math.min(120, Math.round(u / 60))), _ = n.off_trailing ?? 0, h = Math.max(0, Math.min(120, Math.round(_ / 60)));
    return g`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? g`<div class="media-signals">Trigger signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${o.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(n.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(n, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${i}"
              .value=${n.on_event || "trigger"}
              @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...n,
        on_event: f.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            ${s ? g`<label>${o.onTimeout}</label>` : g`<label for="source-on-timeout-${i}">${o.onTimeout}</label>`}
            ${s ? g`
                  <div class="editor-note" data-testid="source-on-state-held">
                    This source is state-held, not timed. Configure vacant behavior below.
                  </div>
                ` : g`
                  <div class="editor-timeout">
                    <input
                      id="source-on-timeout-${i}"
                      type="range"
                      min="1"
                      max="120"
                      step="1"
                      .value=${String(p)}
                      ?disabled=${n.on_timeout === null}
                      @input=${(f) => {
      const m = Number(f.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: m * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: m * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      .value=${String(p)}
                      ?disabled=${n.on_timeout === null}
                      @change=${(f) => {
      const m = Math.max(1, Math.min(120, Number(f.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: m * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: m * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                  <label class="editor-toggle">
                    <input
                      type="checkbox"
                      .checked=${n.on_timeout === null}
                      @change=${(f) => {
      const m = f.target.checked, v = this._onTimeoutMemory[a], $ = p * 60, k = v ?? $;
      m && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: n.on_timeout ?? k
      }), this._updateSourceDraft(t, i, {
        ...n,
        on_timeout: m ? null : k
      });
    }}
                    />
                    Indefinite (until ${o.offState})
                  </label>
                `}
          </div>

          ${r ? g`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${o.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(n, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${i}"
                    .value=${n.off_event || "none"}
                    @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...n,
        off_event: f.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${o.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(h)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @input=${(f) => {
      const m = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: m * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(h)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @change=${(f) => {
      const m = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: m * 60 });
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
  _normalizeActionTriggerType(t) {
    const e = String(t || "").trim().toLowerCase();
    return e === "on_occupied" ? "on_occupied" : e === "on_vacant" ? "on_vacant" : e === "on_dark" ? "on_dark" : e === "on_bright" ? "on_bright" : e === "occupied" ? "on_occupied" : e === "vacant" ? "on_vacant" : e === "dark" ? "on_dark" : e === "bright" ? "on_bright" : "on_occupied";
  }
  _normalizeActionTriggerTypes(t, e) {
    let i, n;
    if (Array.isArray(t) && t.forEach((a) => {
      const r = this._normalizeActionTriggerType(a);
      (r === "on_occupied" || r === "on_vacant") && !i && (i = r), (r === "on_dark" || r === "on_bright") && !n && (n = r);
    }), !i && !n && e) {
      const a = this._normalizeActionTriggerType(e);
      a === "on_occupied" || a === "on_vacant" ? i = a : n = a;
    }
    return [
      "on_occupied",
      "on_vacant",
      "on_dark",
      "on_bright"
    ].filter(
      (a) => a === i || a === n
    );
  }
  _primaryActionTriggerType(t) {
    return t[0] || "on_occupied";
  }
  _occupancyTriggerForRule(t) {
    if (t.includes("on_occupied")) return "on_occupied";
    if (t.includes("on_vacant")) return "on_vacant";
  }
  _ambientTriggerForRule(t) {
    if (t.includes("on_dark")) return "on_dark";
    if (t.includes("on_bright")) return "on_bright";
  }
  _lightingSituationRequirement(t, e, i) {
    if (e === "occupancy") {
      const n = this._normalizeActionAmbientCondition(
        t.ambient_condition,
        i ?? this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type)
      );
      return n === "dark" || n === "bright" ? n : "any";
    }
    return t.must_be_occupied === !0 ? "occupied" : t.must_be_occupied === !1 ? "vacant" : "any";
  }
  _setLightingSituationEvent(t, e, i) {
    const n = this._workingActionRules().find((l) => String(l.id || "") === t);
    if (!n) return;
    const o = this._normalizeActionTriggerTypes(n.trigger_types, n.trigger_type), a = this._occupancyTriggerForRule(o), r = this._ambientTriggerForRule(o), s = {
      trigger_types: this._composeLightingTriggerTypes({
        occupancyTrigger: e === "occupancy" ? i : a,
        ambientTrigger: e === "ambient" ? i : r
      })
    };
    e === "occupancy" && a && this._lightingSituationRequirement(n, "ambient", o) === (a === "on_occupied" ? "occupied" : "vacant") && (s.must_be_occupied = i === "on_occupied"), e === "ambient" && r && this._lightingSituationRequirement(n, "occupancy", o) === (r === "on_bright" ? "bright" : "dark") && (s.ambient_condition = i === "on_bright" ? "bright" : "dark"), this._updateActionRule(t, s);
  }
  _setLightingSituationRequirement(t, e, i) {
    if (e === "occupancy") {
      this._updateActionRule(t, {
        ambient_condition: i === "dark" || i === "bright" ? i : "any"
      });
      return;
    }
    this._updateActionRule(t, {
      must_be_occupied: i === "occupied" ? !0 : i === "vacant" ? !1 : void 0
    });
  }
  _composeLightingTriggerTypes({
    occupancyTrigger: t,
    ambientTrigger: e
  }) {
    return this._normalizeActionTriggerTypes(
      [
        ...t ? [t] : [],
        ...e ? [e] : []
      ],
      t || e || "on_occupied"
    );
  }
  _setLightingOccupancyTrigger(t, e, i, n, o) {
    const a = e ? o || i || "on_occupied" : void 0;
    !a && !n || this._updateActionRule(t, {
      trigger_types: this._composeLightingTriggerTypes({
        occupancyTrigger: a,
        ambientTrigger: n
      })
    });
  }
  _setLightingAmbientTrigger(t, e, i, n, o) {
    const a = e ? o || n || "on_dark" : void 0;
    !i && !a || this._updateActionRule(t, {
      trigger_types: this._composeLightingTriggerTypes({
        occupancyTrigger: i,
        ambientTrigger: a
      })
    });
  }
  _defaultActionAmbientConditionForTrigger(t) {
    const e = Array.isArray(t) ? this._normalizeActionTriggerTypes(t) : this._normalizeActionTriggerTypes([], t), i = e.includes("on_dark"), n = e.includes("on_bright");
    return i && !n ? "dark" : n && !i ? "bright" : "any";
  }
  _lockedActionAmbientConditionForTrigger(t) {
    if (t === "on_dark") return "dark";
    if (t === "on_bright") return "bright";
  }
  _isActionAmbientConditionLockedByTrigger(t) {
    return this._lockedActionAmbientConditionForTrigger(t) !== void 0;
  }
  _lockedActionMustBeOccupiedForTrigger(t) {
    if (t === "on_occupied") return !0;
    if (t === "on_vacant") return !1;
  }
  _isActionMustBeOccupiedLockedByTrigger(t) {
    return this._lockedActionMustBeOccupiedForTrigger(t) !== void 0;
  }
  _actionTriggerLabel(t) {
    return t === "on_occupied" ? "On occupied" : t === "on_vacant" ? "On vacant" : t === "on_bright" ? "On bright" : "On dark";
  }
  _renderChoicePill(t, e, i, n, o, a) {
    return g`
      <label class="choice-pill ${n ? "active" : ""} ${o ? "disabled" : ""}">
        <input
          type="radio"
          name=${t}
          value=${e}
          .checked=${n}
          ?disabled=${o}
          @change=${() => a()}
        />
        <span>${i}</span>
      </label>
    `;
  }
  _renderTogglePill(t, e, i, n) {
    return g`
      <button
        type="button"
        class="choice-pill ${e ? "active" : ""} ${i ? "disabled" : ""}"
        aria-pressed=${e ? "true" : "false"}
        ?disabled=${i}
        @click=${n}
      >
        <span>${t}</span>
      </button>
    `;
  }
  _serviceLabel(t) {
    const e = String(t || "").trim();
    return e ? e.replace(/[_.]+/g, " ") : "";
  }
  _autoActionRuleName(t, e) {
    const i = this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type), n = this._primaryActionTriggerType(i);
    let o = this._actionTriggerLabel(n);
    const a = this._actionTargetsForRule(t), r = a[0], s = String((r == null ? void 0 : r.entity_id) || t.action_entity_id || "").trim();
    s && (o = `${o}: ${this._entityName(s)}`, a.length > 1 && (o = `${o} +${a.length - 1}`));
    const l = this._serviceLabel((r == null ? void 0 : r.service) || t.action_service);
    if (l && (o = `${o} (${l})`), t.time_condition_enabled) {
      const d = this._normalizeActionTime(t.start_time, "18:00"), u = this._normalizeActionTime(t.end_time, "23:59");
      o = `${o} ${d}-${u}`;
    }
    return o === this._actionTriggerLabel(n) ? `${o} (${e + 1})` : o;
  }
  _isPlaceholderRuleName(t) {
    const e = String(t || "").trim();
    return e ? /^Rule \d+$/i.test(e) || /^New rule$/i.test(e) : !0;
  }
  _resolveActionRuleName(t, e) {
    const i = String(t.name || "").trim();
    return this._isPlaceholderRuleName(i) ? this._autoActionRuleName(t, e) : i;
  }
  _normalizeActionAmbientCondition(t, e) {
    const i = String(t || "").trim().toLowerCase();
    return i === "any" || i === "dark" || i === "bright" ? i : this._defaultActionAmbientConditionForTrigger(e);
  }
  _normalizeActionMustBeOccupied(t, e) {
    return typeof t == "boolean" ? t : void 0;
  }
  _normalizeActionTargets(t, e) {
    if (!Array.isArray(t)) return [];
    const i = [], n = /* @__PURE__ */ new Set();
    for (const o of t) {
      if (!o || typeof o != "object" || Array.isArray(o)) continue;
      const a = String(o.entity_id || "").trim();
      if (!a || n.has(a)) continue;
      const s = String(o.service || "").trim() || this._defaultActionServiceForTrigger(a, e), l = this._normalizeActionDataForRule(
        o.data,
        a,
        s
      ), d = this._actionSupportsOnlyIfOff(a, s) && typeof o.only_if_off == "boolean" ? !!o.only_if_off : void 0;
      i.push({
        entity_id: a,
        service: s,
        ...l ? { data: l } : {},
        ...typeof d == "boolean" ? { only_if_off: d } : {}
      }), n.add(a);
    }
    return i;
  }
  _actionTargetsForRule(t) {
    const e = this._primaryActionTriggerType(
      this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type)
    ), i = this._normalizeActionTargets(
      t.actions,
      e
    );
    if (i.length > 0)
      return i;
    const n = String(t.action_entity_id || "").trim();
    if (!n) return [];
    const a = String(t.action_service || "").trim() || this._defaultActionServiceForTrigger(n, e), r = this._normalizeActionDataForRule(t.action_data, n, a);
    return [
      {
        entity_id: n,
        service: a,
        ...r ? { data: r } : {}
      }
    ];
  }
  _setActionTargetsForRule(t, e) {
    const i = this._primaryActionTriggerType(
      this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type)
    ), n = this._normalizeActionTargets(e, i), o = n[0];
    return {
      actions: n,
      action_entity_id: o == null ? void 0 : o.entity_id,
      action_service: o == null ? void 0 : o.service,
      action_data: o == null ? void 0 : o.data
    };
  }
  _normalizeActionTime(t, e) {
    const i = String(t || "").trim();
    if (!i) return e;
    const n = i.split(":");
    if (n.length < 2) return e;
    const o = Number(n[0]), a = Number(n[1]);
    return !Number.isFinite(o) || !Number.isFinite(a) || o < 0 || o > 23 || a < 0 || a > 59 ? e : `${String(o).padStart(2, "0")}:${String(a).padStart(2, "0")}`;
  }
  _generateRuleUuid() {
    const t = globalThis == null ? void 0 : globalThis.crypto;
    if (t && typeof t.randomUUID == "function") {
      const e = String(t.randomUUID()).trim().toLowerCase();
      if (e) return e;
    }
    return `rule_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36).padStart(4, "0")}`;
  }
  _normalizeRuleUuid(t, e) {
    const n = (typeof t == "string" && t.trim().length > 0 ? t.trim().toLowerCase() : "").replace(/[^a-z0-9_-]+/g, "").replace(/^[-_]+|[-_]+$/g, "");
    if (n.length >= 8)
      return n.slice(0, 64);
    const o = String(e || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "").replace(/^[-_]+|[-_]+$/g, "");
    return o.length >= 8 ? o.slice(-64) : this._generateRuleUuid();
  }
  _defaultActionServiceForTrigger(t, e) {
    const i = String(t || "").split(".", 1)[0], n = e === "on_vacant" || e === "on_bright";
    return i === "media_player" ? n ? "media_stop" : "media_play" : n ? "turn_off" : "turn_on";
  }
  _actionSupportsOnlyIfOff(t, e) {
    return t.startsWith("light.") && e === "turn_on";
  }
  _tabSupportsActionAmbient(t) {
    return t === "lighting";
  }
  _ruleTabForEditing(t) {
    const e = String(t.action_entity_id || "").trim();
    if (e)
      return this._tabForActionEntity(e);
    const i = String(t.id || "").trim();
    if (i)
      return this._actionRuleTabById[i];
  }
  _occupancyOnlyAutomationTab(t) {
    return t === "media" || t === "hvac" || t === "appliances";
  }
  /** Strip ambient triggers for Media/HVAC/Appliances before persisting to HA. */
  _sanitizedTriggersForManagedSave(t, e) {
    const i = e ?? this._ruleTabForEditing(t), n = this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type);
    if (!this._occupancyOnlyAutomationTab(i))
      return {
        trigger_types: n,
        trigger_type: this._primaryActionTriggerType(n)
      };
    const o = this._occupancyTriggerForRule(n) || "on_vacant";
    return { trigger_types: [o], trigger_type: o };
  }
  _effectiveAmbientConditionForRule(t, e) {
    const i = e ?? this._ruleTabForEditing(t);
    return i && !this._tabSupportsActionAmbient(i) ? "any" : this._normalizeActionAmbientCondition(
      t.ambient_condition,
      this._normalizeActionTriggerTypes(t.trigger_types, t.trigger_type)
    );
  }
  _normalizeActionBrightnessPct(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) && i > 0 ? Math.max(1, Math.min(100, Math.round(i))) : Math.max(1, Math.min(100, Math.round(e)));
  }
  _normalizeActionPercent(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) ? Math.max(0, Math.min(100, Math.round(i))) : Math.max(0, Math.min(100, Math.round(e)));
  }
  _normalizeActionVolumeLevel(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) && i >= 0 && i <= 1 ? Math.round(i * 100) : this._normalizeActionPercent(t, e);
  }
  _normalizeActionDataForRule(t, e, i) {
    if (!t || typeof t != "object" || Array.isArray(t))
      return;
    const n = String(e || "").trim(), o = String(i || "").trim(), a = { ...t };
    delete a.entity_id;
    const r = n.startsWith("light.") && this._isDimmableEntity(n) && o === "turn_on", s = n.startsWith("media_player.") && o === "volume_mute", l = n.startsWith("media_player.") && o === "volume_set", d = n.startsWith("fan.") && o === "set_percentage";
    Object.prototype.hasOwnProperty.call(a, "brightness_pct") && (r ? a.brightness_pct = this._normalizeActionBrightnessPct(a.brightness_pct, 30) : delete a.brightness_pct), Object.prototype.hasOwnProperty.call(a, "is_volume_muted") && (s && typeof a.is_volume_muted == "boolean" ? a.is_volume_muted = !!a.is_volume_muted : delete a.is_volume_muted), Object.prototype.hasOwnProperty.call(a, "volume_level") && (l ? a.volume_level = this._normalizeActionVolumeLevel(a.volume_level, 30) / 100 : delete a.volume_level), Object.prototype.hasOwnProperty.call(a, "percentage") && (d ? a.percentage = this._normalizeActionPercent(a.percentage, 30) : delete a.percentage);
    for (const [u, p] of Object.entries(a))
      (p == null || p === "") && delete a[u];
    return Object.keys(a).length > 0 ? a : void 0;
  }
  _actionServiceOptionsForRule(t, e) {
    const i = String(t || "").trim();
    if (!i) return [];
    const n = i.split(".", 1)[0];
    if (n === "media_player") {
      const a = [
        { value: "turn_on", label: "Power on", service: "turn_on" },
        { value: "turn_off", label: "Power off", service: "turn_off" },
        { value: "media_play", label: "Play", service: "media_play" },
        { value: "media_play_pause", label: "Play/Pause", service: "media_play_pause" },
        { value: "media_pause", label: "Pause", service: "media_pause" },
        { value: "media_stop", label: "Stop", service: "media_stop" },
        { value: "volume_set", label: "Set volume", service: "volume_set", data: { volume_level: 0.3 } },
        { value: "volume_mute:true", label: "Mute", service: "volume_mute", data: { is_volume_muted: !0 } },
        { value: "volume_mute:false", label: "Unmute", service: "volume_mute", data: { is_volume_muted: !1 } }
      ], r = e === "on_vacant" ? ["media_pause", "media_stop", "turn_off", "volume_mute:true"] : ["media_play", "turn_on", "volume_mute:false", "volume_set"];
      return a.sort((s, l) => {
        const d = r.indexOf(s.value), u = r.indexOf(l.value);
        return d >= 0 || u >= 0 ? d < 0 ? 1 : u < 0 ? -1 : d - u : s.label.localeCompare(l.label);
      });
    }
    if (n === "fan") {
      const a = [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "set_percentage", label: "Set speed", service: "set_percentage", data: { percentage: 30 } }
      ], r = this._defaultActionServiceForTrigger(i, e);
      return a.sort((s, l) => s.service === r ? -1 : l.service === r ? 1 : s.label.localeCompare(l.label));
    }
    if (n === "switch")
      return [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "toggle", label: "Toggle", service: "toggle" }
      ];
    if (n === "light")
      return [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "toggle", label: "Toggle", service: "toggle" }
      ];
    const o = this._defaultActionServiceForTrigger(i, e);
    return [
      { value: "turn_on", label: "Turn on", service: "turn_on" },
      { value: "turn_off", label: "Turn off", service: "turn_off" }
    ].sort((a, r) => a.value === o ? -1 : r.value === o ? 1 : 0);
  }
  _actionServiceOptionValue(t, e) {
    const i = String(t || "").trim();
    return i === "volume_mute" ? `volume_mute:${(typeof (e == null ? void 0 : e.is_volume_muted) == "boolean" ? !!e.is_volume_muted : !0) ? "true" : "false"}` : i === "volume_set" ? "volume_set" : i === "set_percentage" ? "set_percentage" : i;
  }
  _mediaVolumePercent(t) {
    return this._normalizeActionVolumeLevel(
      t == null ? void 0 : t.volume_level,
      30
    );
  }
  _fanSpeedPercent(t) {
    return this._normalizeActionPercent(
      t == null ? void 0 : t.percentage,
      30
    );
  }
  _actionServiceSelection(t, e, i) {
    const o = this._actionServiceOptionsForRule(e, i).find((a) => a.value === t);
    return o ? {
      service: o.service,
      ...o.data ? { data: o.data } : {}
    } : {
      service: String(t || "").trim() || this._defaultActionServiceForTrigger(e, i)
    };
  }
  _actionDomainsForTab(t) {
    return t === "lighting" ? ["light"] : t === "media" ? ["media_player"] : t === "appliances" ? ["fan", "switch"] : ["fan"];
  }
  _tabForActionEntity(t) {
    const e = String(t || "").split(".", 1)[0];
    if (e === "light") return "lighting";
    if (e === "media_player") return "media";
    if (e === "switch") return "appliances";
    if (e === "fan")
      return this._climateDeviceLinkRevision, this._fanEntityLinkedToClimate(t) ? "hvac" : "appliances";
  }
  _isActionRuleEntity(t, e) {
    var o, a;
    if (!((a = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : a[t])) return !1;
    const n = t.split(".", 1)[0];
    return e ? e === "hvac" ? n !== "fan" ? !1 : (this._climateDeviceLinkRevision, this._fanEntityLinkedToClimate(t)) : e === "appliances" ? n === "switch" ? !0 : n === "fan" ? (this._climateDeviceLinkRevision, !this._fanEntityLinkedToClimate(t)) : !1 : this._actionDomainsForTab(e).includes(n) : n === "light" || n === "switch" || n === "media_player" || n === "fan";
  }
  _actionRuleTargetEntities(t) {
    if (!this.location) return [];
    const e = /* @__PURE__ */ new Set();
    for (const i of this.location.entity_ids || [])
      this._isCandidateEntity(i) && this._isActionRuleEntity(i, t) && e.add(i);
    for (const i of this._deviceEnumerationHaAreaIds())
      for (const n of this._entitiesForArea(i))
        this._isCandidateEntity(n) && this._isActionRuleEntity(n, t) && e.add(n);
    for (const i of this._deviceEnumerationExtraEntityIds())
      this._isCandidateEntity(i) && this._isActionRuleEntity(i, t) && e.add(i);
    return [...e].sort((i, n) => this._entityName(i).localeCompare(this._entityName(n)));
  }
  _normalizeActionRule(t, e) {
    const i = this._normalizeActionTriggerTypes(
      t.trigger_types,
      this._normalizeActionTriggerType(t.trigger_type)
    ), n = this._primaryActionTriggerType(i), o = typeof t.id == "string" && t.id.trim().length > 0 ? t.id : `action_rule_${e + 1}`, r = this._actionTargetsForRule(t), s = r[0], l = s == null ? void 0 : s.entity_id, d = s == null ? void 0 : s.service, u = s == null ? void 0 : s.data, p = this._normalizeRuleUuid(t.rule_uuid, o);
    return {
      id: o,
      entity_id: typeof t.entity_id == "string" && t.entity_id.trim().length > 0 ? t.entity_id : `automation.${o}`,
      name: typeof t.name == "string" && t.name.trim().length > 0 ? t.name.trim() : "New rule",
      rule_uuid: p,
      trigger_type: n,
      trigger_types: i,
      actions: r,
      action_entity_id: l || void 0,
      action_service: d || void 0,
      action_data: u,
      ambient_condition: this._normalizeActionAmbientCondition(
        t.ambient_condition,
        i
      ),
      must_be_occupied: this._normalizeActionMustBeOccupied(t.must_be_occupied, n),
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: this._normalizeActionTime(t.start_time, "18:00"),
      end_time: this._normalizeActionTime(t.end_time, "23:59"),
      run_on_startup: !1,
      enabled: t.enabled !== !1,
      require_dark: this._normalizeActionAmbientCondition(t.ambient_condition, i) === "dark"
    };
  }
  _workingActionRules() {
    return (this._actionRulesDraft ?? this._actionRules).map((e, i) => this._normalizeActionRule(e, i));
  }
  _rulesForDeviceAutomationTab(t) {
    return this._workingActionRules().filter((i) => {
      const n = String(i.action_entity_id || "").trim();
      return n ? this._tabForActionEntity(n) === t : this._actionRuleTabById[String(i.id || "")] === t;
    });
  }
  _resetActionRulesDraftFromLoaded() {
    const t = this._actionRules.map(
      (e, i) => this._normalizeActionRule(e, i)
    );
    this._actionRulesDraft = t, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {};
    for (const e of t) {
      const i = String(e.id || ""), n = this._tabForActionEntity(String(e.action_entity_id || "").trim());
      i && n && (this._actionRuleTabById[i] = n);
    }
  }
  _setActionRulesDraft(t) {
    const e = t.map((o, a) => this._normalizeActionRule(o, a)), i = new Set(e.map((o) => String(o.id || ""))), n = {};
    for (const [o, a] of Object.entries(this._actionRuleTabById))
      i.has(o) && (n[o] = a);
    for (const o of e) {
      const a = String(o.id || ""), r = this._tabForActionEntity(String(o.action_entity_id || "").trim());
      a && r && (n[a] = r);
    }
    this._actionRuleTabById = n, this._actionRulesDraft = e, this._actionRulesDraftDirty = this._computeActionRulesDraftDirty(e), this._actionRulesSaveError = void 0, this.requestUpdate();
  }
  _actionRuleLookup(t) {
    const e = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
    return t.forEach((n, o) => {
      const a = this._normalizeActionRule(n, o), r = String(a.id || "").trim();
      r && e.set(r, a);
      const s = this._normalizeRuleUuid(a.rule_uuid, r);
      s && i.set(s, a);
    }), { byId: e, byRuleUuid: i };
  }
  _persistedActionRuleForDraft(t, e) {
    const i = e ?? this._actionRules, n = this._actionRuleLookup(i), o = String(t.id || "").trim();
    if (o && n.byId.has(o))
      return n.byId.get(o);
    const a = this._normalizeRuleUuid(t.rule_uuid, o);
    if (a && n.byRuleUuid.has(a))
      return n.byRuleUuid.get(a);
  }
  _actionRuleComparableSignature(t, e) {
    const i = this._normalizeActionRule(t, e), n = this._actionTargetsForRule(i).map((o) => ({
      entity_id: o.entity_id,
      service: o.service,
      data: this._normalizeActionDataForRule(o.data, o.entity_id, o.service) || {},
      only_if_off: this._actionSupportsOnlyIfOff(o.entity_id, o.service) ? !!o.only_if_off : void 0
    }));
    return JSON.stringify({
      name: this._resolveActionRuleName(i, e),
      trigger_type: this._normalizeActionTriggerType(i.trigger_type),
      trigger_types: this._normalizeActionTriggerTypes(i.trigger_types, i.trigger_type),
      actions: n,
      ambient_condition: this._effectiveAmbientConditionForRule(i),
      must_be_occupied: typeof i.must_be_occupied == "boolean" ? i.must_be_occupied : null,
      time_condition_enabled: !!i.time_condition_enabled,
      start_time: this._normalizeActionTime(i.start_time, "18:00"),
      end_time: this._normalizeActionTime(i.end_time, "23:59"),
      enabled: i.enabled !== !1
    });
  }
  _isActionRuleDirty(t, e, i) {
    const n = i ?? this._persistedActionRuleForDraft(t);
    if (!n)
      return !0;
    const o = String(n.id || "").trim(), a = this._normalizeActionRule(
      {
        ...t,
        ...o ? { id: o } : {}
      },
      e
    );
    return this._actionRuleComparableSignature(a, e) !== this._actionRuleComparableSignature(n, e);
  }
  _computeActionRulesDraftDirty(t) {
    const e = t.map((a, r) => this._normalizeActionRule(a, r)), i = this._actionRules.map(
      (a, r) => this._normalizeActionRule(a, r)
    );
    if (e.length !== i.length)
      return !0;
    const n = this._actionRuleLookup(i), o = /* @__PURE__ */ new Set();
    for (const [a, r] of e.entries()) {
      const s = this._persistedActionRuleForDraft(r, i);
      if (!s || (o.add(String(s.id || "")), this._isActionRuleDirty(r, a, s)))
        return !0;
      const l = this._normalizeRuleUuid(r.rule_uuid, r.id);
      if (l && !n.byRuleUuid.has(l))
        return !0;
    }
    return o.size !== i.length;
  }
  _rebuildActionRulesDraftAfterSync(t, e, i = {}) {
    const n = t.map((l, d) => this._normalizeActionRule(l, d)), o = this._actionRuleLookup(n), a = [...n], r = i.ruleIds || /* @__PURE__ */ new Set(), s = i.ruleUuids || /* @__PURE__ */ new Set();
    for (const [l, d] of e.entries()) {
      const u = this._normalizeActionRule(d, l), p = String(u.id || "").trim(), _ = this._normalizeRuleUuid(u.rule_uuid, p);
      if (r.has(p) || s.has(_))
        continue;
      const h = (p ? o.byId.get(p) : void 0) || (_ ? o.byRuleUuid.get(_) : void 0);
      if (!h) {
        a.push(u);
        continue;
      }
      const f = a.findIndex((m) => String(m.id || "") === String(h.id || ""));
      f < 0 || this._isActionRuleDirty(u, f, h) && (a[f] = this._normalizeActionRule(
        {
          ...u,
          id: h.id,
          entity_id: h.entity_id,
          rule_uuid: h.rule_uuid
        },
        f
      ));
    }
    this._actionRules = n, this._setActionRulesDraft(a);
  }
  _mergeSavedActionRuleLocally(t, e, i) {
    const n = this._normalizeActionRule(t, 0), o = String(n.id || "").trim(), a = this._normalizeRuleUuid(n.rule_uuid, o), r = this._actionRules.filter((l) => {
      const d = String(l.id || "").trim(), u = this._normalizeRuleUuid(l.rule_uuid, d);
      return !(d && o && d === o || d && i && d === i || a && u === a);
    }).map((l, d) => this._normalizeActionRule(l, d));
    r.push(n);
    const s = e.filter((l) => String(l.id || "").trim() !== i).map((l, d) => this._normalizeActionRule(l, d));
    if (s.push(n), this._actionRules = r, this._setActionRulesDraft(s), i && i !== o) {
      const l = this._actionRuleTabById[i];
      l && o && (this._actionRuleTabById = {
        ...this._actionRuleTabById,
        [o]: l
      }, delete this._actionRuleTabById[i]);
    }
  }
  _addActionRule(t) {
    try {
      const e = this._workingActionRules(), n = this._actionRuleTargetEntities(t)[0] || "", a = [t === "media" ? "on_vacant" : "on_occupied"], r = this._primaryActionTriggerType(a), s = `action_rule_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
      this._actionRuleTabById[s] = t;
      const l = {
        id: s,
        entity_id: "",
        name: "New rule",
        rule_uuid: this._generateRuleUuid(),
        trigger_type: r,
        trigger_types: a,
        actions: n ? [
          {
            entity_id: n,
            service: this._defaultActionServiceForTrigger(n, r)
          }
        ] : [],
        action_entity_id: n || void 0,
        action_service: this._defaultActionServiceForTrigger(n, r),
        ambient_condition: t === "lighting" ? "dark" : "any",
        must_be_occupied: t === "lighting" ? void 0 : this._normalizeActionMustBeOccupied(void 0, r),
        time_condition_enabled: !1,
        start_time: "18:00",
        end_time: "23:59",
        run_on_startup: !1,
        enabled: !0
      };
      this._setActionRulesDraft([...e, l]), this._showToast(`Draft ${t} rule added`, "success");
    } catch (e) {
      console.error("[topomation] failed to add action rule", e), this._showToast((e == null ? void 0 : e.message) || "Failed to add draft rule", "error");
    }
  }
  _updateActionRule(t, e) {
    const i = this._workingActionRules().map((n, o) => {
      if (n.id !== t) return this._normalizeActionRule(n, o);
      const a = this._normalizeActionTriggerTypes(
        n.trigger_types,
        n.trigger_type
      ), r = {
        ...n,
        ...e
      };
      let s = this._actionTargetsForRule(r);
      if (Object.prototype.hasOwnProperty.call(e, "trigger_type") || Object.prototype.hasOwnProperty.call(e, "trigger_types")) {
        const d = this._normalizeActionTriggerTypes(
          Object.prototype.hasOwnProperty.call(e, "trigger_types") ? e.trigger_types : Object.prototype.hasOwnProperty.call(e, "trigger_type") ? [] : r.trigger_types,
          Object.prototype.hasOwnProperty.call(e, "trigger_type") ? this._normalizeActionTriggerType(e.trigger_type) : this._normalizeActionTriggerType(r.trigger_type)
        ), u = this._primaryActionTriggerType(d);
        if (r.trigger_type = u, r.trigger_types = d, !Object.prototype.hasOwnProperty.call(e, "ambient_condition")) {
          const p = this._defaultActionAmbientConditionForTrigger(a), _ = this._defaultActionAmbientConditionForTrigger(d);
          r.ambient_condition = this._normalizeActionAmbientCondition(r.ambient_condition, a) === p ? _ : this._normalizeActionAmbientCondition(r.ambient_condition, d);
        }
        !Object.prototype.hasOwnProperty.call(e, "action_service") && !Object.prototype.hasOwnProperty.call(e, "actions") && (s = s.map((p) => {
          const _ = this._defaultActionServiceForTrigger(p.entity_id, u), h = this._normalizeActionDataForRule(
            p.data,
            p.entity_id,
            _
          );
          return {
            entity_id: p.entity_id,
            service: _,
            ...h ? { data: h } : {}
          };
        }));
      }
      if (Object.prototype.hasOwnProperty.call(e, "actions") && (s = this._normalizeActionTargets(
        e.actions,
        this._primaryActionTriggerType(
          this._normalizeActionTriggerTypes(r.trigger_types, r.trigger_type)
        )
      )), Object.prototype.hasOwnProperty.call(e, "action_entity_id")) {
        const d = String(e.action_entity_id || "").trim();
        if (!d)
          s = [];
        else if (s.length === 0) {
          const u = this._defaultActionServiceForTrigger(
            d,
            this._primaryActionTriggerType(
              this._normalizeActionTriggerTypes(r.trigger_types, r.trigger_type)
            )
          );
          s = [{ entity_id: d, service: u }];
        } else {
          const u = { ...s[0], entity_id: d };
          Object.prototype.hasOwnProperty.call(e, "action_service") || (u.service = this._defaultActionServiceForTrigger(
            d,
            this._primaryActionTriggerType(
              this._normalizeActionTriggerTypes(r.trigger_types, r.trigger_type)
            )
          )), u.data = this._normalizeActionDataForRule(
            u.data,
            u.entity_id,
            u.service
          ), s = [
            {
              entity_id: u.entity_id,
              service: u.service,
              ...u.data ? { data: u.data } : {}
            },
            ...s.slice(1)
          ];
        }
      }
      if (Object.prototype.hasOwnProperty.call(e, "action_service")) {
        const d = String(e.action_service || "").trim();
        if (s.length === 0) {
          const u = String(r.action_entity_id || "").trim();
          u && d && (s = [
            {
              entity_id: u,
              service: d
            }
          ]);
        } else {
          const u = s[0], p = this._normalizeActionDataForRule(
            Object.prototype.hasOwnProperty.call(e, "action_data") ? e.action_data : u.data,
            u.entity_id,
            d
          );
          s = [
            {
              entity_id: u.entity_id,
              service: d,
              ...p ? { data: p } : {}
            },
            ...s.slice(1)
          ];
        }
      }
      if (Object.prototype.hasOwnProperty.call(e, "action_data") && !Object.prototype.hasOwnProperty.call(e, "action_service") && s.length > 0) {
        const d = s[0], u = this._normalizeActionDataForRule(
          e.action_data,
          d.entity_id,
          d.service
        );
        s = [
          {
            entity_id: d.entity_id,
            service: d.service,
            ...u ? { data: u } : {}
          },
          ...s.slice(1)
        ];
      }
      const l = this._setActionTargetsForRule(r, s);
      return r.actions = l.actions, r.action_entity_id = l.action_entity_id, r.action_service = l.action_service, r.action_data = l.action_data, this._normalizeActionRule(r, o);
    });
    this._setActionRulesDraft(i);
  }
  _removeActionRule(t) {
    const e = this._workingActionRules().filter((i) => i.id !== t);
    this._setActionRulesDraft(e);
  }
  _duplicateActionRule(t) {
    const e = this._workingActionRules(), i = e.findIndex((u) => String(u.id || "") === t);
    if (i < 0) return;
    const n = this._normalizeActionRule(e[i], i), o = `action_rule_${Date.now()}_${Math.floor(Math.random() * 1e3)}`, a = this._actionTargetsForRule(n).map((u) => ({
      entity_id: u.entity_id,
      service: u.service,
      ...u.data ? { data: { ...u.data } } : {},
      ...typeof u.only_if_off == "boolean" ? { only_if_off: u.only_if_off } : {}
    })), r = `${this._resolveActionRuleName(n, i)} copy`, s = this._normalizeActionRule(
      {
        ...n,
        id: o,
        entity_id: "",
        name: r,
        rule_uuid: this._generateRuleUuid(),
        actions: a
      },
      e.length
    ), l = [
      ...e.slice(0, i + 1),
      s,
      ...e.slice(i + 1)
    ], d = this._ruleTabForEditing(n);
    d && (this._actionRuleTabById[o] = d), this._setActionRulesDraft(l), this._startActionRuleNameEdit(o, r);
  }
  _startActionRuleNameEdit(t, e) {
    this._editingActionRuleNameId = t, this._editingActionRuleNameValue = e, this.requestUpdate();
  }
  _cancelActionRuleNameEdit() {
    this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "";
  }
  _commitActionRuleNameEdit(t, e) {
    const i = this._editingActionRuleNameValue.trim() || e;
    this._cancelActionRuleNameEdit(), this._updateActionRule(t, { name: i });
  }
  _actionRuleValidationErrors(t) {
    const e = [], i = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return t.forEach((n, o) => {
      var l;
      const a = ((l = n.name) == null ? void 0 : l.trim()) || "New rule";
      this._normalizeActionTriggerTypes(n.trigger_types, n.trigger_type).length === 0 && e.push(`${a}: select at least one trigger.`);
      const s = this._actionTargetsForRule(n);
      s.length === 0 && e.push(`${a}: select at least one target device.`), s.some((d) => !d.service) && e.push(`${a}: select an action service for each target.`), n.time_condition_enabled && (i.test(String(n.start_time || "")) || e.push(`${a}: begin time must be HH:MM.`), i.test(String(n.end_time || "")) || e.push(`${a}: end time must be HH:MM.`));
    }), e;
  }
  async _saveActionRulesDraft() {
    if (!this.location || !this.hass || this._savingActionRules) return;
    const t = this._workingActionRules().map((i, n) => ({
      ...i,
      name: this._resolveActionRuleName(i, n)
    })), e = this._actionRuleValidationErrors(t);
    if (e.length > 0) {
      this._actionRulesSaveError = e[0], this.requestUpdate();
      return;
    }
    this._savingActionRules = !0, this._actionRulesSaveError = void 0, this.requestUpdate();
    try {
      const i = await ce(
        this.hass,
        this.location.id,
        this.entryId
      ), n = new Map(i.map((l) => [String(l.id || ""), l])), o = new Map(
        i.map((l) => {
          const d = String(l.rule_uuid || "").trim();
          return d ? [this._normalizeRuleUuid(d, l.id), l] : ["", l];
        }).filter(([l]) => l.length > 0)
      ), a = /* @__PURE__ */ new Set();
      for (const [l, d] of t.entries()) {
        const u = this._normalizeActionRule(d, l), p = this._actionTargetsForRule(u), _ = p[0];
        if (!_) continue;
        const h = n.get(String(u.id || "")) || o.get(
          this._normalizeRuleUuid(u.rule_uuid, u.id)
        ), f = this._ruleTabForEditing(u), m = this._effectiveAmbientConditionForRule(u, f), v = this._sanitizedTriggersForManagedSave(u, f), $ = h ? String(h.id || "") : void 0, k = await Gi(
          this.hass,
          {
            location: this.location,
            name: u.name || "New rule",
            rule_uuid: u.rule_uuid,
            automation_id: $ || void 0,
            trigger_type: v.trigger_type,
            trigger_types: v.trigger_types,
            actions: p,
            action_entity_id: _.entity_id,
            action_service: _.service,
            action_data: _.data,
            ambient_condition: m,
            must_be_occupied: u.must_be_occupied,
            time_condition_enabled: !!u.time_condition_enabled,
            start_time: u.start_time,
            end_time: u.end_time,
            require_dark: m === "dark"
          },
          this.entryId
        );
        a.add(String(k.id || ""));
      }
      const r = i.filter((l) => !a.has(String(l.id || ""))).map((l) => Ki(this.hass, l, this.entryId));
      r.length > 0 && await Promise.all(r);
      const s = await ce(
        this.hass,
        this.location.id,
        this.entryId
      );
      this._actionRules = s, this._resetActionRulesDraftFromLoaded(), this._showToast("Action rules saved", "success");
    } catch (i) {
      this._actionRulesSaveError = (i == null ? void 0 : i.message) || "Failed to save action rules", this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = !1, this.requestUpdate();
    }
  }
  _discardActionRuleEdits(t) {
    const e = this._workingActionRules(), i = [];
    for (const [n, o] of e.entries()) {
      const a = this._normalizeActionRule(o, n);
      if (String(a.id || "") !== t) {
        i.push(a);
        continue;
      }
      const r = this._persistedActionRuleForDraft(a);
      r && i.push(this._normalizeActionRule(r, n));
    }
    this._setActionRulesDraft(i), this._showToast("Rule edits discarded", "success");
  }
  async _saveOrUpdateActionRule(t) {
    if (!this.location || !this.hass || this._savingActionRules)
      return;
    const e = this._workingActionRules(), i = e.findIndex((r) => String(r.id || "") === t);
    if (i < 0)
      return;
    const n = this._normalizeActionRule(e[i], i), o = this._actionRuleValidationErrors([
      {
        ...n,
        name: this._resolveActionRuleName(n, i)
      }
    ]);
    if (o.length > 0) {
      this._actionRulesSaveError = o[0], this.requestUpdate();
      return;
    }
    const a = this._persistedActionRuleForDraft(n);
    this._savingActionRules = !0, this._actionRulesSaveError = void 0, this.requestUpdate();
    try {
      const r = this._actionTargetsForRule(n), s = r[0], l = this._ruleTabForEditing(n), d = this._effectiveAmbientConditionForRule(n, l), u = this._sanitizedTriggersForManagedSave(n, l);
      if (!s)
        throw new Error("Select at least one target device before saving.");
      const p = await Gi(
        this.hass,
        {
          location: this.location,
          name: this._resolveActionRuleName(n, i),
          rule_uuid: n.rule_uuid,
          automation_id: a && String(a.id || "").trim() || void 0,
          trigger_type: u.trigger_type,
          trigger_types: u.trigger_types,
          actions: r,
          action_entity_id: s.entity_id,
          action_service: s.service,
          action_data: s.data,
          ambient_condition: d,
          must_be_occupied: n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: n.start_time,
          end_time: n.end_time,
          run_on_startup: !1,
          require_dark: d === "dark"
        },
        this.entryId
      );
      this._mergeSavedActionRuleLocally(p, e, t), this._showToast(a ? "Rule updated" : "Rule saved", "success");
    } catch (r) {
      this._actionRulesSaveError = (r == null ? void 0 : r.message) || "Failed to save action rule", this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = !1, this.requestUpdate();
    }
  }
  async _deleteActionRule(t) {
    if (!this.location || !this.hass || this._savingActionRules)
      return;
    const e = this._workingActionRules(), i = e.findIndex((a) => String(a.id || "") === t);
    if (i < 0)
      return;
    const n = this._normalizeActionRule(e[i], i), o = this._persistedActionRuleForDraft(n);
    if (!o) {
      this._removeActionRule(t), this._showToast("Rule removed", "success");
      return;
    }
    this._savingActionRules = !0, this._actionRulesSaveError = void 0, this.requestUpdate();
    try {
      await Ki(this.hass, o, this.entryId);
      const a = await ce(this.hass, this.location.id, this.entryId);
      this._rebuildActionRulesDraftAfterSync(a, e, {
        ruleIds: /* @__PURE__ */ new Set([t]),
        ruleUuids: /* @__PURE__ */ new Set([this._normalizeRuleUuid(n.rule_uuid, t)])
      }), this._showToast("Rule deleted", "success");
    } catch (a) {
      this._actionRulesSaveError = (a == null ? void 0 : a.message) || "Failed to delete action rule", this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = !1, this.requestUpdate();
    }
  }
  _resetActionRulesDraft() {
    this._resetActionRulesDraftFromLoaded(), this._showToast("Action rule changes reverted", "success");
  }
  _deviceAutomationTabMeta(t) {
    return t === "lighting" ? {
      icon: "mdi:lightbulb-group",
      label: "Lighting Rules",
      emptyMessage: "No lighting rules configured yet."
    } : t === "appliances" ? {
      icon: "mdi:tumble-dryer",
      label: "Appliance Rules",
      emptyMessage: "No appliance rules configured yet."
    } : t === "media" ? {
      icon: "mdi:speaker-wireless",
      label: "Media Rules",
      emptyMessage: "No media rules configured yet."
    } : {
      icon: "mdi:thermostat",
      label: "HVAC Rules",
      emptyMessage: "No HVAC rules configured yet."
    };
  }
  _renderLightingTriggerRows(t, e, i) {
    const n = this._normalizeActionTriggerTypes(e.trigger_types, e.trigger_type), o = this._occupancyTriggerForRule(n), a = this._ambientTriggerForRule(n), r = this._lightingSituationRequirement(
      e,
      "occupancy",
      n
    ), s = this._lightingSituationRequirement(e, "ambient", n);
    return g`
      <div class="dusk-rule-section-title">When</div>
      <div class="lighting-situation-list">
        <div
          class="lighting-situation-card"
          data-testid=${`action-rule-${t}-trigger-family-occupancy`}
        >
          <div class="lighting-situation-head">
            <div class="lighting-situation-title">Occupancy change</div>
          </div>
          <div class="lighting-situation-body">
            <div class="lighting-situation-row">
              <span class="config-label">Trigger</span>
              <div class="choice-pill-group">
                ${this._renderTogglePill(
      "Room becomes occupied",
      o === "on_occupied",
      i,
      () => o === "on_occupied" ? this._setLightingOccupancyTrigger(
        t,
        !1,
        o,
        a
      ) : this._setLightingSituationEvent(t, "occupancy", "on_occupied")
    )}
                ${this._renderTogglePill(
      "Room becomes vacant",
      o === "on_vacant",
      i,
      () => o === "on_vacant" ? this._setLightingOccupancyTrigger(
        t,
        !1,
        o,
        a
      ) : this._setLightingSituationEvent(t, "occupancy", "on_vacant")
    )}
              </div>
            </div>
            ${o ? g`
                  <div class="lighting-situation-row">
                    <span class="config-label">Only if</span>
                    <div class="choice-pill-group">
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-occupancy-condition`,
      "any",
      "Any",
      r === "any",
      i,
      () => this._setLightingSituationRequirement(t, "occupancy", "any")
    )}
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-occupancy-condition`,
      "dark",
      "It is dark",
      r === "dark",
      i,
      () => this._setLightingSituationRequirement(t, "occupancy", "dark")
    )}
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-occupancy-condition`,
      "bright",
      "It is bright",
      r === "bright",
      i,
      () => this._setLightingSituationRequirement(t, "occupancy", "bright")
    )}
                    </div>
                  </div>
                ` : ""}
          </div>
        </div>

        <div
          class="lighting-situation-card"
          data-testid=${`action-rule-${t}-trigger-family-ambient`}
        >
          <div class="lighting-situation-head">
            <div class="lighting-situation-title">Ambient light change</div>
          </div>
          <div class="lighting-situation-body">
            <div class="lighting-situation-row">
              <span class="config-label">Trigger</span>
              <div class="choice-pill-group">
                ${this._renderTogglePill(
      "It becomes dark",
      a === "on_dark",
      i,
      () => a === "on_dark" ? this._setLightingAmbientTrigger(
        t,
        !1,
        o,
        a
      ) : this._setLightingSituationEvent(t, "ambient", "on_dark")
    )}
                ${this._renderTogglePill(
      "It becomes bright",
      a === "on_bright",
      i,
      () => a === "on_bright" ? this._setLightingAmbientTrigger(
        t,
        !1,
        o,
        a
      ) : this._setLightingSituationEvent(t, "ambient", "on_bright")
    )}
              </div>
            </div>
            ${a ? g`
                  <div class="lighting-situation-row">
                    <span class="config-label">Only if</span>
                    <div class="choice-pill-group">
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-ambient-condition`,
      "any",
      "Any",
      s === "any",
      i,
      () => this._setLightingSituationRequirement(t, "ambient", "any")
    )}
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-ambient-condition`,
      "occupied",
      "Room is occupied",
      s === "occupied",
      i,
      () => this._setLightingSituationRequirement(t, "ambient", "occupied")
    )}
                      ${this._renderChoicePill(
      `lighting-trigger-${t}-ambient-condition`,
      "vacant",
      "Room is vacant",
      s === "vacant",
      i,
      () => this._setLightingSituationRequirement(t, "ambient", "vacant")
    )}
                    </div>
                  </div>
                ` : ""}
          </div>
        </div>
      </div>
    `;
  }
  _renderLightingRuleActionRows(t, e, i, n) {
    const o = this._actionTargetsForRule(e), a = new Map(o.map((s) => [s.entity_id, s])), r = [...n];
    for (const s of o)
      r.includes(s.entity_id) || r.unshift(s.entity_id);
    return r.length === 0 ? g`<div class="text-muted">No local lights found for this location.</div>` : g`
      <div class="dusk-light-actions" data-testid=${`action-rule-${t}-actions`}>
        ${r.map((s, l) => {
      const d = a.get(s), u = !!d, p = this._isDimmableEntity(s), _ = this._defaultActionServiceForTrigger(
        s,
        this._primaryActionTriggerType(
          this._normalizeActionTriggerTypes(e.trigger_types, e.trigger_type)
        )
      ), h = String((d == null ? void 0 : d.service) || _), f = this._normalizeActionDataForRule(d == null ? void 0 : d.data, s, h), m = this._normalizeActionBrightnessPct(
        f == null ? void 0 : f.brightness_pct,
        30
      ), v = this._actionSupportsOnlyIfOff(s, h), $ = v ? !!(d != null && d.only_if_off) : !1, k = u ? h === "turn_off" ? "off" : h === "toggle" ? "toggle" : "on" : _ === "turn_off" ? "off" : "on", b = u && h === "turn_off" ? 0 : m, M = (D) => {
        const R = o.map((nt) => ({ ...nt })), E = R.findIndex((nt) => nt.entity_id === s), H = E >= 0 ? { ...R[E] } : {
          service: _
        }, it = String(D.service ?? H.service ?? "").trim() || _, K = this._normalizeActionDataForRule(
          D.data ?? H.data,
          s,
          it
        ), J = {
          entity_id: s,
          service: it,
          ...K ? { data: K } : {},
          ...this._actionSupportsOnlyIfOff(s, it) && typeof (D.only_if_off ?? H.only_if_off) == "boolean" ? { only_if_off: !!(D.only_if_off ?? H.only_if_off) } : {}
        };
        E >= 0 ? R[E] = J : R.push(J), this._updateActionRule(t, { actions: R });
      }, F = () => {
        this._updateActionRule(t, {
          actions: o.filter((D) => D.entity_id !== s)
        });
      };
      return g`
            <div class="dusk-light-action-row" data-testid=${`action-rule-${t}-device-row-${l}`}>
              <div class="dusk-light-action-grid ${u ? "" : "disabled"}">
                <input
                  type="checkbox"
                  class="switch-input"
                  .checked=${u}
                  ?disabled=${i}
                  data-testid=${`action-rule-${t}-device-include-${l}`}
                  @change=${(D) => {
        if (!D.target.checked) {
          if (!u) return;
          F();
          return;
        }
        M({
          service: _,
          data: p && _ === "turn_on" ? {
            brightness_pct: m
          } : {}
        });
      }}
                />
                <div class="dusk-light-entity-meta">
                  <span>${this._entityName(s)}</span>
                  <code>${s}</code>
                </div>
                ${p ? g`
                      <label class="dusk-level-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          class="dusk-level-slider"
                          .value=${String(b)}
                          ?disabled=${i || !u}
                          data-testid=${`action-rule-${t}-device-level-${l}`}
                          @input=${(D) => {
        const R = Number(D.target.value), E = Number.isFinite(R) ? Math.max(0, Math.min(100, Math.round(R))) : m;
        if (E <= 0) {
          M({
            service: "turn_off",
            data: {}
          });
          return;
        }
        M({
          service: "turn_on",
          data: {
            ...f || {},
            brightness_pct: E
          }
        });
      }}
                        />
                        <span class="dusk-level-value">${b}%</span>
                      </label>
                      ${u && v ? g`
                            <div class="dusk-inline-option-row">
                              ${this._renderTogglePill(
        "Only if off",
        $,
        i,
        () => {
          M({
            only_if_off: !$
          });
        }
      )}
                            </div>
                          ` : g``}
                    ` : g`
                      <div class="dusk-light-action-switch">
                        <select
                          .value=${k}
                          ?disabled=${i || !u}
                          data-testid=${`action-rule-${t}-device-action-${l}`}
                          @change=${(D) => {
        const R = String(D.target.value || "on"), E = R === "off" ? "turn_off" : R === "toggle" ? "toggle" : "turn_on";
        M({
          service: E,
          data: {},
          ...E === "turn_on" ? {} : { only_if_off: void 0 }
        });
      }}
                        >
                          <option value="on">Turn on</option>
                          <option value="off">Turn off</option>
                          <option value="toggle">Toggle</option>
                        </select>
                        ${u && v ? g`
                              <div class="dusk-inline-option-row">
                                ${this._renderTogglePill(
        "Only if off",
        $,
        i,
        () => {
          M({
            only_if_off: !$
          });
        }
      )}
                              </div>
                            ` : g``}
                      </div>
                    `}
                <span class="text-muted">-</span>
                <span class="text-muted">-</span>
              </div>
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderLightingRuleEditor(t, e, i, n) {
    return g`
      ${this._renderLightingTriggerRows(t, e, i)}

      <div class="dusk-inline-heading-row">
        <div class="dusk-rule-section-title">Time window</div>
        <div class="choice-pill-group">
          ${this._renderTogglePill(
      "Any time",
      !e.time_condition_enabled,
      i,
      () => this._updateActionRule(t, {
        time_condition_enabled: !1
      })
    )}
          ${this._renderTogglePill(
      "Limit to a time range",
      !!e.time_condition_enabled,
      i,
      () => this._updateActionRule(t, {
        time_condition_enabled: !e.time_condition_enabled
      })
    )}
        </div>
      </div>
      <div class="lighting-time-window">
        ${e.time_condition_enabled ? g`
              <div class="dusk-time-fields">
                <label class="dusk-time-field">
                  <span class="config-label">Begin</span>
                  <input
                    type="time"
                    class="input"
                    .value=${String(e.start_time || "18:00")}
                    ?disabled=${i}
                    @change=${(o) => this._updateActionRule(t, {
      start_time: this._normalizeActionTime(
        o.target.value,
        "18:00"
      )
    })}
                  />
                </label>
                <label class="dusk-time-field">
                  <span class="config-label">End</span>
                  <input
                    type="time"
                    class="input"
                    .value=${String(e.end_time || "23:59")}
                    ?disabled=${i}
                    @change=${(o) => this._updateActionRule(t, {
      end_time: this._normalizeActionTime(
        o.target.value,
        "23:59"
      )
    })}
                  />
                </label>
              </div>
            ` : ""}
      </div>

      <div class="dusk-rule-section-title">Lights</div>
      ${this._renderLightingRuleActionRows(t, e, i, n)}
    `;
  }
  _occupancyOnlyPickOccupancyTrigger(t, e) {
    this._updateActionRule(t, {
      trigger_types: [e],
      trigger_type: e,
      ambient_condition: "any",
      must_be_occupied: void 0
    });
  }
  _renderOccupancyOnlyTriggerRows(t, e, i) {
    const n = this._normalizeActionTriggerTypes(e.trigger_types, e.trigger_type), o = this._occupancyTriggerForRule(n) || "on_vacant";
    return g`
      <div class="dusk-rule-section-title">When</div>
      <div class="lighting-situation-list">
        <div
          class="lighting-situation-card"
          data-testid=${`action-rule-${t}-trigger-occupancy-only`}
        >
          <div class="lighting-situation-head">
            <div class="lighting-situation-title">Occupancy change</div>
          </div>
          <div class="lighting-situation-body">
            <div class="lighting-situation-row">
              <span class="config-label">Run when</span>
              <div class="choice-pill-group">
                ${this._renderChoicePill(
      `occ-tab-${t}-occupied`,
      "on_occupied",
      "Room becomes occupied",
      o === "on_occupied",
      i,
      () => this._occupancyOnlyPickOccupancyTrigger(t, "on_occupied")
    )}
                ${this._renderChoicePill(
      `occ-tab-${t}-vacant`,
      "on_vacant",
      "Room becomes vacant",
      o === "on_vacant",
      i,
      () => this._occupancyOnlyPickOccupancyTrigger(t, "on_vacant")
    )}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _renderOccupancyOnlyActionsBlock(t, e, i, n, o) {
    const a = this._normalizeActionTriggerTypes(i.trigger_types, i.trigger_type), r = this._primaryActionTriggerType(a), s = String(i.action_entity_id || "").trim(), l = this._normalizeActionDataForRule(
      i.action_data,
      s,
      String(i.action_service || "")
    ), d = this._actionServiceOptionsForRule(s, r), u = this._actionServiceOptionValue(
      i.action_service,
      l
    ), p = t === "media" && s.startsWith("media_player.") && u === "volume_set", _ = (t === "hvac" || t === "appliances") && s.startsWith("fan.") && u === "set_percentage";
    return g`
      <div class="dusk-rule-section-title">Actions</div>
      <div class="dusk-rule-row">
        <span class="config-label">Target device</span>
        <select
          class="dusk-wide-select"
          .value=${s}
          ?disabled=${n}
          @change=${(h) => {
      const f = String(h.target.value || "").trim();
      if (!f) {
        this._updateActionRule(e, {
          action_entity_id: void 0,
          action_service: void 0,
          action_data: {}
        });
        return;
      }
      const m = this._defaultActionServiceForTrigger(f, r);
      this._updateActionRule(e, {
        action_entity_id: f,
        action_service: m,
        action_data: {}
      });
    }}
        >
          <option value="">Select device...</option>
          ${o.map(
      (h) => g`
              <option value=${h}>${this._entityName(h)}</option>
            `
    )}
        </select>
      </div>
      <div class="dusk-rule-row">
        <span class="config-label">Action</span>
        <select
          class="dusk-wide-select"
          .value=${u}
          ?disabled=${n || !s}
          @change=${(h) => {
      const f = String(h.target.value || "").trim(), m = this._actionServiceSelection(
        f,
        s,
        r
      );
      this._updateActionRule(e, {
        action_service: m.service,
        action_data: m.data || {}
      });
    }}
        >
          ${s ? d.map(
      (h) => g`<option value=${h.value}>${h.label}</option>`
    ) : g`<option value="">Select device first...</option>`}
        </select>
      </div>
      ${p ? g`
            <div class="dusk-rule-row">
              <span class="config-label">Volume</span>
              <div class="config-value">
                <div class="dusk-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    .value=${String(this._mediaVolumePercent(l))}
                    ?disabled=${n}
                    @input=${(h) => {
      const f = this._normalizeActionPercent(
        h.target.value,
        30
      );
      this._updateActionRule(e, {
        action_data: { volume_level: f / 100 }
      });
    }}
                  />
                  <span class="text-muted">${this._mediaVolumePercent(l)}%</span>
                </div>
              </div>
            </div>
          ` : ""}
      ${_ ? g`
            <div class="dusk-rule-row">
              <span class="config-label">Fan speed</span>
              <div class="config-value">
                <div class="dusk-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    .value=${String(this._fanSpeedPercent(l))}
                    ?disabled=${n}
                    @input=${(h) => {
      const f = this._normalizeActionPercent(
        h.target.value,
        30
      );
      this._updateActionRule(e, {
        action_data: { percentage: f }
      });
    }}
                  />
                  <span class="text-muted">${this._fanSpeedPercent(l)}%</span>
                </div>
              </div>
            </div>
          ` : ""}
    `;
  }
  _renderOccupancyOnlyRuleEditor(t, e, i, n, o) {
    return g`
      ${this._renderOccupancyOnlyTriggerRows(e, i, n)}
      <div class="dusk-inline-heading-row">
        <div class="dusk-rule-section-title">Time window</div>
        <div class="choice-pill-group">
          ${this._renderTogglePill(
      "Any time",
      !i.time_condition_enabled,
      n,
      () => this._updateActionRule(e, {
        time_condition_enabled: !1
      })
    )}
          ${this._renderTogglePill(
      "Limit to a time range",
      !!i.time_condition_enabled,
      n,
      () => this._updateActionRule(e, {
        time_condition_enabled: !i.time_condition_enabled
      })
    )}
        </div>
      </div>
      <div class="lighting-time-window">
        ${i.time_condition_enabled ? g`
              <div class="dusk-time-fields">
                <label class="dusk-time-field">
                  <span class="config-label">Begin</span>
                  <input
                    type="time"
                    class="input"
                    .value=${String(i.start_time || "18:00")}
                    ?disabled=${n}
                    @change=${(a) => this._updateActionRule(e, {
      start_time: this._normalizeActionTime(
        a.target.value,
        "18:00"
      )
    })}
                  />
                </label>
                <label class="dusk-time-field">
                  <span class="config-label">End</span>
                  <input
                    type="time"
                    class="input"
                    .value=${String(i.end_time || "23:59")}
                    ?disabled=${n}
                    @change=${(a) => this._updateActionRule(e, {
      end_time: this._normalizeActionTime(
        a.target.value,
        "23:59"
      )
    })}
                  />
                </label>
              </div>
            ` : ""}
      </div>
      ${this._renderOccupancyOnlyActionsBlock(t, e, i, n, o)}
    `;
  }
  _renderDeviceAutomationTab(t) {
    if (!this.location) return "";
    const e = this._savingActionRules, i = this._deviceAutomationTabMeta(t), n = this._rulesForDeviceAutomationTab(t), o = this._actionRuleTargetEntities(t), a = t === "lighting" ? "light" : t === "appliances" ? "fan or switch" : t === "media" ? "media" : "HVAC-linked fan", r = n.some((s, l) => {
      const d = this._persistedActionRuleForDraft(s);
      return !d || this._isActionRuleDirty(s, l, d);
    });
    return g`
      <div class="card-section" data-testid="actions-rules-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${i.icon}></ha-icon>
            ${i.label}
          </div>
        </div>
        ${this._actionRulesError ? g`<div class="policy-warning">${this._actionRulesError}</div>` : ""}
        ${this._actionRulesSaveError ? g`<div class="policy-warning">${this._actionRulesSaveError}</div>` : ""}

        <div class="dusk-block-list">
          ${n.length === 0 ? g`
                <div class="text-muted">
                  ${i.emptyMessage}
                  ${o.length === 0 ? g`No compatible ${a} devices found in this location.` : ""}
                </div>
              ` : n.map((s, l) => {
      var m;
      const d = String(s.id || ""), u = this._editingActionRuleNameId === d, p = ((m = s.name) == null ? void 0 : m.trim()) || `Rule ${l + 1}`, _ = this._persistedActionRuleForDraft(s), h = !!_, f = this._isActionRuleDirty(s, l, _);
      return g`
                  <div class="dusk-block-row" data-testid=${`action-rule-${d}`}>
                    <div class="dusk-block-head">
                      ${u ? g`
                            <input
                              type="text"
                              class="input dusk-block-title-input"
                              .value=${this._editingActionRuleNameValue}
                              ?disabled=${e}
                              @input=${(v) => {
        this._editingActionRuleNameValue = v.target.value;
      }}
                              @blur=${() => this._commitActionRuleNameEdit(
        d,
        "New rule"
      )}
                              @keydown=${(v) => {
        v.key === "Enter" ? this._commitActionRuleNameEdit(
          d,
          "New rule"
        ) : v.key === "Escape" && this._cancelActionRuleNameEdit();
      }}
                            />
                          ` : g`
                            <button
                              type="button"
                              class="dusk-block-title-button"
                              ?disabled=${e}
                              @click=${() => this._startActionRuleNameEdit(
        d,
        p
      )}
                            >
                              ${p}
                            </button>
                          `}
                    </div>

                    ${t === "lighting" ? this._renderLightingRuleEditor(d, s, e, o) : this._renderOccupancyOnlyRuleEditor(t, d, s, e, o)}
                    <div class="dusk-block-footer">
                      ${h ? f ? g`
                              <button
                                class="button button-primary"
                                type="button"
                                data-testid=${`action-rule-${d}-update`}
                                ?disabled=${e}
                                @click=${() => this._saveOrUpdateActionRule(d)}
                              >
                                Update rule
                              </button>
                              <button
                                class="button button-secondary"
                                type="button"
                                data-testid=${`action-rule-${d}-discard-edits`}
                                ?disabled=${e}
                                @click=${() => this._discardActionRuleEdits(d)}
                              >
                                Discard edits
                              </button>
                              <button
                                class="button button-secondary dusk-delete-rule-button"
                                type="button"
                                data-testid=${`action-rule-${d}-delete`}
                                ?disabled=${e}
                                @click=${() => this._deleteActionRule(d)}
                              >
                                Delete rule
                              </button>
                              <button
                                class="button button-secondary"
                                type="button"
                                data-testid=${`action-rule-${d}-duplicate`}
                                ?disabled=${e}
                                @click=${() => this._duplicateActionRule(d)}
                              >
                                Duplicate rule
                              </button>
                            ` : g`
                              <button
                                class="button button-secondary dusk-delete-rule-button"
                                type="button"
                                data-testid=${`action-rule-${d}-delete`}
                                ?disabled=${e}
                                @click=${() => this._deleteActionRule(d)}
                              >
                                Delete rule
                              </button>
                              <button
                                class="button button-secondary"
                                type="button"
                                data-testid=${`action-rule-${d}-duplicate`}
                                ?disabled=${e}
                                @click=${() => this._duplicateActionRule(d)}
                              >
                                Duplicate rule
                              </button>
                            ` : g`
                            <button
                              class="button button-primary"
                              type="button"
                              data-testid=${`action-rule-${d}-save`}
                              ?disabled=${e}
                              @click=${() => this._saveOrUpdateActionRule(d)}
                            >
                              Save rule
                            </button>
                            <button
                              class="button button-secondary"
                              type="button"
                              data-testid=${`action-rule-${d}-remove`}
                              ?disabled=${e}
                              @click=${() => this._removeActionRule(d)}
                            >
                              Remove rule
                            </button>
                            <button
                              class="button button-secondary"
                              type="button"
                              data-testid=${`action-rule-${d}-duplicate`}
                              ?disabled=${e}
                              @click=${() => this._duplicateActionRule(d)}
                            >
                              Duplicate rule
                            </button>
                          `}
                    </div>
                    <div class="config-help dusk-rule-footer-help">
                      Use Duplicate rule for another time window or trigger variant.
                    </div>
                  </div>
                `;
    })}
        </div>

        ${r ? "" : g`
              <div class="dusk-list-footer">
                <button
                  class="button button-primary"
                  type="button"
                  data-testid="action-rule-add"
                  @click=${() => this._addActionRule(t)}
                >
                  Add rule
                </button>
              </div>
            `}
      </div>
    `;
  }
  _workingSources(t) {
    return [...t.occupancy_sources || []];
  }
  _setWorkingSources(t, e) {
    const i = e.map((o) => this._normalizeSource(o.entity_id, o)), n = { ...this._onTimeoutMemory };
    for (const o of i)
      typeof o.on_timeout == "number" && o.on_timeout > 0 && (n[this._sourceKeyFromSource(o)] = o.on_timeout);
    this._onTimeoutMemory = n, this._setOccupancyDraft({
      ...t,
      occupancy_sources: i
    });
  }
  _updateSourceDraft(t, e, i) {
    const n = this._workingSources(t), o = n[e];
    if (!o) return;
    const a = this._modeOptionsForEntity(o.entity_id).map((s) => s.value), r = this._normalizeSource(
      o.entity_id,
      {
        ...i,
        mode: a.includes(i.mode) ? i.mode : a[0]
      }
    );
    n[e] = r, this._setWorkingSources(t, n);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), n = i[t];
    if (!n) return;
    i.splice(t, 1);
    const o = { ...this._onTimeoutMemory };
    delete o[this._sourceKeyFromSource(n)], this._onTimeoutMemory = o, this._setWorkingSources(e, i);
  }
  _removeSourcesByKey(t, e) {
    if (!t.length) return;
    const i = new Set(t), n = this._workingSources(e), o = n.filter((r) => !i.has(this._sourceKeyFromSource(r)));
    if (o.length === n.length) return;
    const a = { ...this._onTimeoutMemory };
    for (const r of n) {
      const s = this._sourceKeyFromSource(r);
      i.has(s) && delete a[s];
    }
    this._onTimeoutMemory = a, this._setWorkingSources(e, o);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location) return !1;
    if (this._isFloorLocation())
      return this._showToast("Floor locations do not support occupancy sources.", "error"), !1;
    const n = this._workingSources(e), o = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (n.some((d) => this._sourceKeyFromSource(d) === o))
      return !1;
    const a = this.hass.states[t];
    if (!a)
      return this._showToast(`Entity not found: ${t}`, "error"), !1;
    let s = En(a);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? s = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (s = this._lightSignalDefaults(t, i.signalKey));
    const l = this._normalizeSource(t, s);
    return this._setWorkingSources(e, [...n, l]), i != null && i.resetExternalPicker && (this._resetExternalSourceSelection(), this.requestUpdate()), !0;
  }
  _openExternalSourceDialog() {
    this._externalSourceDialogOpen = !0, this.requestUpdate();
  }
  _closeExternalSourceDialog() {
    this._externalSourceDialogOpen = !1, this._resetExternalSourceSelection(), this.requestUpdate();
  }
  _resetExternalSourceSelection() {
    this._externalAreaId = "", this._externalEntityId = "";
  }
  _canAddSelectedExternalSource(t) {
    const e = this._externalEntityId.trim();
    return e ? !new Set(this._workingSources(t).map((n) => this._sourceKeyFromSource(n))).has(this._sourceKey(e, this._defaultSignalKeyForEntity(e))) : !1;
  }
  _confirmExternalSourceSelection(t) {
    const e = this._externalEntityId.trim();
    !e || !this._addSourceWithDefaults(e, t, {
      resetExternalPicker: !0,
      signalKey: this._defaultSignalKeyForEntity(e)
    }) || (this._externalSourceDialogOpen = !1, this.requestUpdate());
  }
  _resetSourceDraftState() {
  }
  _normalizeSource(t, e) {
    var u;
    const i = this._isMediaEntity(t), n = this._isDimmableEntity(t), o = this._isColorCapableEntity(t), a = (u = e.source_id) != null && u.includes("::") ? e.source_id.split("::")[1] : void 0, r = this._defaultSignalKeyForEntity(t), s = e.signal_key || a || r;
    let l;
    (i && (s === "playback" || s === "volume" || s === "mute") || (n || o) && (s === "power" || s === "level" || s === "color")) && (l = s);
    const d = e.source_id || this._sourceKey(t, l);
    return {
      entity_id: t,
      source_id: d,
      signal_key: l,
      mode: e.mode || "any_change",
      on_event: e.on_event || "trigger",
      on_timeout: e.on_timeout,
      off_event: e.off_event || "none",
      off_trailing: e.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    return this.location ? this._sanitizeOccupancyConfig(this._occupancyDraft || this._persistedOccupancyConfig(), this.location.id) : this._sanitizeOccupancyConfig(this._occupancyDefaults());
  }
  _availableSourceAreas() {
    var o, a;
    if (this._isSiblingAreaSourceScope())
      return this._siblingSourceAreas();
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = this._managedShadowAreaIdSet(), i = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(i).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).filter((r) => !e.has(r.area_id)).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, s) => r.name.localeCompare(s.name));
  }
  _isSiblingAreaSourceScope() {
    if (!this.location || C(this.location) !== "area" || !this.location.ha_area_id) return !1;
    const t = this.allLocations || [];
    if (t.length === 0) return !1;
    const e = this.location.parent_id ?? null;
    if (!e) return !1;
    const i = t.find((n) => n.id === e);
    return !!i && C(i) === "floor";
  }
  _siblingSourceAreas() {
    if (!this.location || !this._isSiblingAreaSourceScope()) return [];
    const t = this.location.parent_id ?? null;
    if (!t) return [];
    const e = this.location.id, i = /* @__PURE__ */ new Set(), n = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((o) => o.id !== e).filter((o) => (o.parent_id ?? null) === t).filter((o) => C(o) === "area").filter((o) => !this._isManagedShadowLocation(o, n)).filter((o) => !!o.ha_area_id).filter((o) => {
      const a = o.ha_area_id;
      return i.has(a) ? !1 : (i.add(a), !0);
    }).map((o) => ({
      area_id: o.ha_area_id,
      name: o.name || o.ha_area_id
    })).sort((o, a) => o.name.localeCompare(a.name));
  }
  _managedShadowAreaIdSet() {
    const t = /* @__PURE__ */ new Set(), e = this._managedShadowLocationIds();
    for (const i of this.allLocations || [])
      this._isManagedShadowLocation(i, e) && i.ha_area_id && t.add(i.ha_area_id);
    return t;
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((n) => this._isCandidateEntity(n)).sort((n, o) => this._entityName(n).localeCompare(this._entityName(o))) : Object.keys(e).filter((n) => {
      var a, r;
      const o = this._entityAreaById[n];
      return o != null ? o === t : ((r = (a = e[n]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === t;
    }).filter((n) => this._isCandidateEntity(n)).sort((n, o) => this._entityName(n).localeCompare(this._entityName(o)));
  }
  _isCandidateEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const n = e.attributes || {};
    if (this._isTopomationOccupancyOutput(n)) return !1;
    const o = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player"].includes(o))
      return !0;
    if (o === "binary_sensor") {
      const s = String(n.device_class || "");
      return s ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(s) : !0;
    }
    return !1;
  }
  _isCoreAreaSourceEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const n = e.attributes || {};
    if (this._isTopomationOccupancyOutput(n)) return !1;
    const o = t.split(".", 1)[0];
    if (o === "light" || o === "fan" || o === "media_player")
      return !0;
    if (o === "switch")
      return this._isLightClassifiedSwitch(n);
    if (o === "binary_sensor") {
      const s = String(n.device_class || "");
      return s ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(s) : !0;
    }
    return !1;
  }
  _isLightClassifiedSwitch(t) {
    return String(t.device_class || "").toLowerCase() === "light";
  }
  _isTopomationOccupancyOutput(t) {
    if (t.device_class !== "occupancy") return !1;
    const e = t.location_id;
    return typeof e == "string" && e.trim().length > 0;
  }
  _getOccupancyStateForLocation(t) {
    var n;
    const e = this._liveOccupancyStateByLocation[t];
    if (e)
      return e;
    const i = ((n = this.hass) == null ? void 0 : n.states) || {};
    for (const o of Object.values(i)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if (a.device_class === "occupancy" && a.location_id === t)
        return o;
    }
  }
  _getOccupancyState() {
    if (this.location)
      return this._getOccupancyStateForLocation(this._effectiveOccupancyTopologyId());
  }
  _descendantLocations(t) {
    const e = /* @__PURE__ */ new Map();
    for (const o of this.allLocations || []) {
      const a = typeof o.parent_id == "string" ? o.parent_id : null;
      if (!a) continue;
      const r = e.get(a) || [];
      r.push(o), e.set(a, r);
    }
    const i = [], n = [...e.get(t) || []];
    for (; n.length; ) {
      const o = n.shift();
      i.push(o);
      const a = e.get(o.id) || [];
      a.length && n.unshift(...a);
    }
    return i;
  }
  /** Descendant topology ids (same shape as ht-room-explainability for rollup). */
  _descendantLocationIds(t) {
    const e = /* @__PURE__ */ new Map();
    for (const o of this.allLocations || [])
      o.parent_id && (e.has(o.parent_id) || e.set(o.parent_id, []), e.get(o.parent_id).push(o.id));
    const i = [], n = [...e.get(t) || []];
    for (; n.length; ) {
      const o = n.pop();
      i.push(o), n.push(...e.get(o) || []);
    }
    return i;
  }
  /**
   * Structural hosts (property/building/floor/grounds): occupied if this row or any descendant
   * is occupied — matches tree dots and Occupancy Explainability dock (ADR-HA-078).
   */
  _aggregateOccupiedStateForStructural() {
    if (!this.location || !this._isStructuralSummaryLocation()) return;
    const t = this._resolveOccupiedState(this._getOccupancyState());
    if (t === !0) return !0;
    const e = this._descendantLocationIds(this.location.id);
    if (!e.length) return t;
    const i = e.map((n) => {
      var o;
      return (o = this.occupancyStates) == null ? void 0 : o[n];
    }).filter((n) => typeof n == "boolean");
    return i.includes(!0) ? !0 : t === !1 || i.length > 0 && i.every((n) => n === !1) ? !1 : t;
  }
  /** Active contributors from occupied descendants when this structural row has none on its shadow entity. */
  _aggregateDescendantContributionsForStructural() {
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set();
    return this._descendantLocationIds(this.location.id).flatMap((e) => {
      var s, l;
      if (((s = this.occupancyStates) == null ? void 0 : s[e]) !== !0) return [];
      const i = (this.allLocations || []).find((d) => d.id === e), n = this._getOccupancyStateForLocation(e), o = {
        default_timeout: 300,
        default_trailing_timeout: 120,
        occupancy_sources: [],
        ...(l = i == null ? void 0 : i.modules) != null && l.occupancy && typeof i.modules.occupancy == "object" ? i.modules.occupancy : {}
      }, a = (n == null ? void 0 : n.attributes) || {};
      return (Array.isArray(a.contributions) ? a.contributions : []).map((d) => {
        if (!this._isContributionActive(d)) return;
        const u = typeof (d == null ? void 0 : d.source_id) == "string" && d.source_id ? d.source_id : typeof (d == null ? void 0 : d.source) == "string" && d.source ? d.source : "";
        if (!u) return;
        const p = `${e}::${u}`;
        if (t.has(p)) return;
        t.add(p);
        const _ = this._parseDateValue(d == null ? void 0 : d.updated_at) || this._parseDateValue(d == null ? void 0 : d.changed_at) || this._parseDateValue(d == null ? void 0 : d.last_changed) || this._parseDateValue(d == null ? void 0 : d.timestamp), h = String((d == null ? void 0 : d.state) || (d == null ? void 0 : d.state_value) || "").trim() || "active", f = _ ? `${this._formatElapsedDuration(_)} ago` : "active", m = this._sourceLabelForSourceId(o, u);
        return {
          sourceLabel: `${(i == null ? void 0 : i.name) || e}: ${m}`,
          sourceId: u,
          stateLabel: h,
          relativeTime: f,
          _timestampMs: _ ? _.getTime() : this._nowEpochMs
        };
      }).filter(
        (d) => !!d
      );
    }).sort((e, i) => i._timestampMs - e._timestampMs).map(({ sourceLabel: e, sourceId: i, stateLabel: n, relativeTime: o }) => ({
      sourceLabel: e,
      sourceId: i,
      stateLabel: n,
      relativeTime: o
    }));
  }
  _structureSummary() {
    if (!this.location || !this._isStructuralSummaryLocation()) return;
    const t = this._descendantLocations(this.location.id), e = t.filter((o) => {
      var a;
      return o.parent_id === ((a = this.location) == null ? void 0 : a.id);
    }).length, i = t.filter((o) => {
      const a = C(o);
      return a === "area" || a === "subarea";
    }).length, n = t.filter((o) => {
      const a = this._getOccupancyStateForLocation(o.id);
      return this._resolveOccupiedState(a, o.id) === !0;
    }).length;
    return {
      directChildren: e,
      descendantRooms: i,
      occupiedDescendants: n
    };
  }
  _resolveOccupiedState(t, e) {
    var s, l, d, u;
    const i = e ?? this._effectiveOccupancyTopologyId(), n = i ? (s = this.occupancyTransitions) == null ? void 0 : s[i] : void 0, o = (l = this._parseDateValue(n == null ? void 0 : n.changedAt)) == null ? void 0 : l.getTime(), a = (d = this._parseDateValue(
      (t == null ? void 0 : t.last_changed) || (t == null ? void 0 : t.last_updated)
    )) == null ? void 0 : d.getTime();
    if (n && typeof n.occupied == "boolean" && (a === void 0 || o !== void 0 && o > a))
      return n.occupied;
    if ((t == null ? void 0 : t.state) === "on")
      return !0;
    if ((t == null ? void 0 : t.state) === "off")
      return !1;
    const r = i ? (u = this.occupancyStates) == null ? void 0 : u[i] : void 0;
    if (typeof r == "boolean")
      return r;
  }
  _activeContributorsExcluding(t) {
    const e = this._getOccupancyState();
    if (((e == null ? void 0 : e.state) || "").toLowerCase() !== "on") return [];
    const i = (e == null ? void 0 : e.attributes) || {}, n = Array.isArray(i.contributions) ? i.contributions : [];
    if (!n.length) return [];
    const o = String(t || "").trim(), a = n.map((r) => String((r == null ? void 0 : r.source_id) || "").trim()).filter((r) => r.length > 0 && r !== o);
    return Array.from(new Set(a));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, n = e.lock_modes, o = e.direct_locks, a = Array.isArray(i) ? i.map((l) => String(l)) : [], r = Array.isArray(n) ? n.map((l) => String(l)) : [], s = Array.isArray(o) ? o.map((l) => ({
      sourceId: String((l == null ? void 0 : l.source_id) || "unknown"),
      mode: String((l == null ? void 0 : l.mode) || "freeze"),
      scope: String((l == null ? void 0 : l.scope) || "self")
    })).sort(
      (l, d) => `${l.sourceId}:${l.mode}:${l.scope}`.localeCompare(`${d.sourceId}:${d.mode}:${d.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: a,
      lockModes: r,
      directLocks: s
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i)
      return i;
    const n = Array.isArray(t.contributions) ? t.contributions : [];
    if (!n.length)
      return;
    let o = !1, a;
    for (const r of n) {
      const s = r == null ? void 0 : r.expires_at;
      if (s == null) {
        o = !0;
        continue;
      }
      const l = this._parseDateValue(s);
      l && (!a || l.getTime() > a.getTime()) && (a = l);
    }
    return o ? null : a;
  }
  _formatVacantAtLabel(t) {
    return t instanceof Date ? this._formatDateTime(t) : "No timeout scheduled";
  }
  _resolveVacancyReason(t, e) {
    var a, r, s, l, d;
    if (e !== !1) return;
    const i = this._effectiveOccupancyTopologyId();
    if (!i) return;
    const n = (r = (a = this.occupancyTransitions) == null ? void 0 : a[i]) == null ? void 0 : r.reason;
    if (((l = (s = this.occupancyTransitions) == null ? void 0 : s[i]) == null ? void 0 : l.occupied) === !1) {
      const u = this._formatOccupancyReason(n);
      if (u) return u;
    }
    return this._formatOccupancyReason((d = t == null ? void 0 : t.attributes) == null ? void 0 : d.reason);
  }
  _resolveOccupiedReason(t, e) {
    var l, d, u, p, _;
    if (e !== !0) return;
    const i = this._effectiveOccupancyTopologyId();
    if (!i) return;
    const n = (d = (l = this.occupancyTransitions) == null ? void 0 : l[i]) == null ? void 0 : d.reason;
    if (((p = (u = this.occupancyTransitions) == null ? void 0 : u[i]) == null ? void 0 : p.occupied) === !0) {
      const h = this._formatOccupancyReason(n);
      if (h) return h;
    }
    const a = this._formatOccupancyReason((_ = t == null ? void 0 : t.attributes) == null ? void 0 : _.reason);
    if (a) return a;
    const r = this._occupancyContributions(this._getOccupancyConfig(), !0);
    return r.length ? `Contributed by ${r[0].sourceLabel}` : "Active source events detected";
  }
  _formatOccupancyReason(t) {
    if (typeof t != "string") return;
    const e = t.trim();
    if (!e) return;
    const i = e.toLowerCase();
    if (i === "timeout")
      return "Vacated by timeout";
    if (i === "propagation:parent")
      return "Vacated because the parent location cleared";
    if (i.startsWith("propagation:child:")) {
      const n = e.split(":").slice(2).join(":").trim();
      return n ? `Vacated because child location ${this._locationName(n)} cleared` : "Vacated because a child location cleared";
    }
    if (i.startsWith("event:")) {
      const n = i.split(":", 2)[1];
      if (n === "clear") return "Vacated by clear event";
      if (n === "vacate") return "Vacated explicitly";
      if (n) return this._formatOccupancyEventReason(n, "vacancy");
    }
    if (i.startsWith("occupancy:")) {
      const n = i.split(":", 2)[1];
      if (n) return this._formatOccupancyEventReason(n, "occupied");
    }
    return `Reason: ${e}`;
  }
  _recentExplainabilityCurrentState() {
    const t = this._getOccupancyState();
    if (!t) return;
    const e = this._isStructuralSummaryLocation(), i = e ? this._aggregateOccupiedStateForStructural() === !0 : this._resolveOccupiedState(t) === !0, n = t.attributes || {}, o = e ? (() => {
      const u = this._occupancyContributions(this._getOccupancyConfig(), !0);
      return u.length ? u : this._aggregateDescendantContributionsForStructural();
    })() : this._occupancyContributions(this._getOccupancyConfig(), !0), a = this._resolveVacantAt(n, i), r = this._getLockState(), s = i ? e ? this._resolveOccupiedReason(
      t,
      this._resolveOccupiedState(t) === !0
    ) || (o.length ? `Occupied via ${o[0].sourceLabel}` : "Active source events detected") : this._resolveOccupiedReason(t, !0) || "Active source events detected" : this._resolveVacancyReason(t, !1) || "No active contributors remain";
    let l;
    i && (a === null ? l = "No timeout scheduled" : a instanceof Date && (l = `Vacates ${this._formatDateTime(a)}`));
    let d;
    return r.isLocked && (d = r.lockedBy.length ? `Held by ${r.lockedBy.join(", ")}` : "Occupancy is held by a lock"), {
      occupied: i,
      why: s,
      nextChange: l,
      lockedSummary: d,
      contributors: o
    };
  }
  _recentExplainabilityChanges() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {};
    return (Array.isArray(e.recent_changes) ? e.recent_changes : []).map((n) => this._normalizeExplainabilityChange(n)).filter((n) => !!n).map((n) => {
      const o = this._parseDateValue(n.changedAt), a = n.sourceId ? this._sourceLabelForSourceId(this._getOccupancyConfig(), n.sourceId) : void 0;
      return {
        title: this._explainabilityChangeTitle(n),
        description: this._explainabilityChangeDescription(n, a),
        timeLabel: o ? this._formatTimeOnly(o) : "Now",
        relativeTime: o ? `${this._formatElapsedDuration(o)} ago` : "just now",
        changedAtMs: (o == null ? void 0 : o.getTime()) || this._nowEpochMs
      };
    }).sort((n, o) => o.changedAtMs - n.changedAtMs);
  }
  _normalizeExplainabilityChange(t) {
    if (!t || typeof t != "object") return;
    const e = t.kind === "signal" ? "signal" : t.kind === "state" ? "state" : void 0, i = typeof t.event == "string" ? t.event.trim().toLowerCase() : "";
    if (!(!e || !i))
      return {
        kind: e,
        event: i,
        sourceId: typeof t.source_id == "string" && t.source_id.trim() ? t.source_id.trim() : void 0,
        signalKey: typeof t.signal_key == "string" && t.signal_key.trim() ? t.signal_key.trim() : void 0,
        reason: typeof t.reason == "string" && t.reason.trim() ? t.reason.trim() : void 0,
        occupied: typeof t.occupied == "boolean" ? t.occupied : void 0,
        changedAt: typeof t.changed_at == "string" && t.changed_at.trim() ? t.changed_at : void 0
      };
  }
  _explainabilityChangeTitle(t) {
    return t.kind === "state" ? t.event === "occupied" ? "Location became occupied" : "Location became vacant" : t.event === "trigger" ? "Source triggered" : t.event === "clear" ? "Source cleared" : t.event === "vacate" ? "Vacate requested" : `Source ${t.event}`;
  }
  _explainabilityChangeDescription(t, e) {
    if (t.kind === "state")
      return this._formatOccupancyReason(t.reason) || (t.event === "occupied" ? "Occupancy turned on" : "Occupancy turned off");
    const i = e ? `${e}${t.sourceId && e !== t.sourceId ? ` (${t.sourceId})` : ""}` : t.sourceId || "Unknown source";
    return t.event === "trigger" ? `${i} reported activity` : t.event === "clear" ? `${i} cleared its contribution` : t.event === "vacate" ? `${i} requested vacancy` : `${i} reported ${t.event}`;
  }
  _formatOccupancyEventReason(t, e) {
    const n = {
      occupied: "Occupied by",
      vacancy: "Vacated by"
    }[e];
    return t === "handoff" ? `${n} room handoff` : t === "trigger" ? `${n} trigger` : t === "inherit" ? `${n} inherited state` : `${n} ${t} event`;
  }
  _occupancyContributions(t, e = !1) {
    const i = this._getOccupancyState();
    if (!i) return [];
    const n = i.attributes || {}, o = Array.isArray(n.contributions) ? n.contributions : [], a = this._nowEpochMs, s = [...o.map((d) => {
      const u = typeof (d == null ? void 0 : d.source_id) == "string" && d.source_id ? d.source_id : typeof (d == null ? void 0 : d.source) == "string" && d.source ? d.source : "";
      if (!u) return;
      const p = this._sourceLabelForSourceId(t, u), _ = String((d == null ? void 0 : d.state) || (d == null ? void 0 : d.state_value) || "").trim() || "active", h = this._parseDateValue(d == null ? void 0 : d.updated_at) || this._parseDateValue(d == null ? void 0 : d.changed_at) || this._parseDateValue(d == null ? void 0 : d.last_changed) || this._parseDateValue(d == null ? void 0 : d.timestamp), f = h ? `${this._formatElapsedDuration(h)} ago` : this._isContributionActive(d) ? "active" : "inactive";
      return {
        sourceLabel: p,
        sourceId: u,
        stateLabel: _,
        relativeTime: f,
        _timestampMs: h ? h.getTime() : a + (_ === "active" ? 0 : -1),
        _active: this._isContributionActive(d)
      };
    }).filter(
      (d) => !!d
    )].sort((d, u) => d._active !== u._active ? d._active ? -1 : 1 : u._timestampMs - d._timestampMs);
    return (e ? s.filter((d) => d._active) : s).map(({ sourceLabel: d, stateLabel: u, relativeTime: p, sourceId: _ }) => ({
      sourceLabel: d === _ || this._structuralSourceLabel(_) ? d : `${d} (${_})`,
      sourceId: _,
      stateLabel: u,
      relativeTime: p
    }));
  }
  _isContributionActive(t) {
    if (!t) return !1;
    const e = String(t.state || t.value || "").toLowerCase();
    if (e === "on" || e === "active" || e === "occupied" || e === "trigger")
      return !0;
    const i = this._parseDateValue(t.expires_at);
    return i ? i.getTime() > this._nowEpochMs : !1;
  }
  _sourceLabelForSourceId(t, e) {
    const i = this._structuralSourceLabel(e);
    if (i)
      return i;
    const n = (t.occupancy_sources || []).find(
      (o) => o.source_id === e || o.entity_id === e
    );
    if (n)
      return this._candidateTitle(
        n.entity_id,
        n.signal_key || this._normalizedSignalKey(n.entity_id, void 0)
      );
    if (e.includes("::")) {
      const [o, a] = e.split("::"), r = this._normalizedSignalKey(o, a), s = (t.occupancy_sources || []).find(
        (l) => l.entity_id === o
      );
      return s ? this._candidateTitle(s.entity_id, s.signal_key || r) : this._candidateTitle(o, r);
    }
    return this._entityName(e);
  }
  _structuralSourceLabel(t) {
    const e = String(t || "").trim();
    if (!e) return;
    const i = (n, o, a) => {
      const r = `${n}${o}`;
      if (!e.startsWith(r)) return;
      const s = e.slice(r.length).trim();
      if (s)
        return `${a}: ${this._locationName(s)}`;
    };
    return i("__child__", ":", "Child location") || i("__child__", ".", "Child location") || i("__follow__", ":", "Parent location") || i("__follow__", ".", "Parent location") || (e.startsWith("linked:") ? `Linked location: ${this._locationName(e.slice(7).trim())}` : void 0) || this._knownLocationLabel(e);
  }
  _knownLocationLabel(t) {
    const e = String(t || "").trim();
    if (!e) return;
    const i = (this.allLocations || []).find((a) => a.id === e);
    if (!i) return;
    const n = C(i);
    return `${n === "building" ? "Building" : n === "grounds" ? "Grounds" : n === "property" ? "Property" : n === "floor" ? "Floor" : "Location"}: ${i.name}`;
  }
  _parseDateValue(t) {
    if (t instanceof Date && !Number.isNaN(t.getTime()))
      return t;
    if (typeof t == "number" && Number.isFinite(t)) {
      const i = t > 1e12 ? t : t * 1e3, n = new Date(i);
      return Number.isNaN(n.getTime()) ? void 0 : n;
    }
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
  _formatTimeOnly(t) {
    return new Intl.DateTimeFormat(void 0, {
      timeStyle: "short"
    }).format(t);
  }
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), a = e % 60, r = [];
    return i > 0 && r.push(`${i}d`), n > 0 && r.push(`${n}h`), o > 0 && r.length < 2 && r.push(`${o}m`), (r.length === 0 || i === 0 && n === 0 && o === 0) && r.push(`${a}s`), r.slice(0, 2).join(" ");
  }
  _formatElapsedDuration(t) {
    const e = Math.max(0, Math.floor((this._nowEpochMs - t.getTime()) / 1e3));
    if (e <= 0) return "just now";
    const i = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), a = e % 60, r = [];
    return i > 0 && r.push(`${i}d`), n > 0 && r.push(`${n}h`), o > 0 && r.length < 2 && r.push(`${o}m`), (r.length === 0 || i === 0 && n === 0 && o === 0) && r.push(`${a}s`), r.slice(0, 2).join(" ");
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
    const i = t.mode === "any_change" ? "Any change" : "Specific states", n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0, a = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(n)})` : "ON: ignore", r = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(o)})` : "OFF: ignore";
    return `${i} • ${a} • ${r}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(g`<span class="event-chip">ON -> trigger (${this._formatDuration(n)})</span>`) : i.push(g`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      g`<span class="event-chip off">OFF -> clear (${this._formatDuration(o)})</span>`
    ) : i.push(g`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t], i = (e == null ? void 0 : e.attributes) || {}, n = t.split(".", 1)[0], o = String(i.device_class || "");
    return n === "person" || n === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : n === "binary_sensor" ? [
      "door",
      "garage_door",
      "opening",
      "window",
      "motion",
      "presence",
      "occupancy",
      "vibration",
      "sound"
    ].includes(o) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player"].includes(n) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(t) {
    const e = t.entity_id.split(".", 1)[0];
    return !(e === "media_player" && (t.signal_key === "volume" || t.signal_key === "mute") || e === "light" && (t.signal_key === "level" || t.signal_key === "color"));
  }
  _isDirectPresenceSource(t) {
    var o, a, r;
    const e = t.entity_id.split(".", 1)[0];
    if (e === "person" || e === "device_tracker")
      return !0;
    if (e !== "binary_sensor")
      return !1;
    const i = (a = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : a[t.entity_id], n = String(((r = i == null ? void 0 : i.attributes) == null ? void 0 : r.device_class) || "").toLowerCase();
    return ["presence", "occupancy"].includes(n);
  }
  _isStateHeldPresenceSource(t) {
    return this._isDirectPresenceSource(t) && (t.on_event || "trigger") === "trigger" && t.on_timeout === null;
  }
  _eventLabelsForSource(t) {
    var d, u;
    const e = t.entity_id, i = (u = (d = this.hass) == null ? void 0 : d.states) == null ? void 0 : u[e], n = (i == null ? void 0 : i.attributes) || {}, o = e.split(".", 1)[0], a = String(n.device_class || "");
    let r = "ON", s = "OFF";
    o === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(a) ? (r = "Open", s = "Closed") : o === "binary_sensor" && a === "motion" ? (r = "Motion", s = "No motion") : o === "binary_sensor" && ["presence", "occupancy"].includes(a) ? (r = "Detected", s = "Not detected") : o === "person" || o === "device_tracker" ? (r = "Home", s = "Away") : o === "media_player" ? t.signal_key === "volume" ? (r = "Volume change", s = "No volume change") : t.signal_key === "mute" ? (r = "Mute change", s = "No mute change") : (r = "Playing", s = "Paused/idle") : o === "light" && t.signal_key === "level" ? (r = "Brightness change", s = "No brightness change") : o === "light" && t.signal_key === "color" ? (r = "Color change", s = "No color change") : (o === "light" && t.signal_key === "power" || o === "light" || o === "switch" || o === "fan") && (r = "On", s = "Off");
    const l = this._isDirectPresenceSource(t);
    return {
      onState: r,
      offState: s,
      onBehavior: l ? "When presence is detected" : "When activity is detected",
      onTimeout: l ? "Occupied state" : "Occupied hold time",
      offBehavior: l ? "When presence stops" : "When activity stops",
      offDelay: "Vacant delay"
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
          const r = this._getOccupancyConfig().default_timeout || 300, s = t.on_timeout === null ? r : t.on_timeout ?? r, l = t.source_id || t.entity_id;
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
        const i = t.off_trailing ?? 0, n = t.source_id || t.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: "clear",
          service_data: this._serviceDataWithEntryId({
            location_id: this.location.id,
            source_id: n,
            trailing_timeout: Math.max(0, i)
          })
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "clear",
              locationId: this.location.id,
              sourceId: n,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        );
        const o = Math.max(0, i);
        o > 0 ? this._showToast(
          `Cleared ${n} with ${this._formatDuration(o)} trailing`,
          "success"
        ) : this._showToast(`Cleared ${n}`, "success");
        const a = this._activeContributorsExcluding(n);
        if (a.length > 0) {
          const r = a.slice(0, 2).join(", "), s = a.length > 2 ? ` +${a.length - 2} more` : "";
          this._showToast(`Still occupied by ${r}${s}`, "error");
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
  async _runSyncImport(t) {
    if (!this._syncImportInProgress) {
      this._syncImportInProgress = !0;
      try {
        const e = await this.hass.callWS(
          this._withEntryId({
            type: "topomation/sync/import",
            force: !0
          })
        ), i = typeof (e == null ? void 0 : e.message) == "string" ? String(e.message) : "Sync import completed";
        t != null && t.silent || this._showToast(i, "success");
      } catch (e) {
        console.error("Failed to run sync import:", e), t != null && t.silent || this._showToast((e == null ? void 0 : e.message) || "Failed to run sync import", "error");
      } finally {
        this._syncImportInProgress = !1, t != null && t.backgroundRepair && (this._managedShadowAutoRepairInProgress = !1);
      }
    }
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
    const e = this._getOccupancyConfig(), i = !(e.enabled ?? !0);
    this._setOccupancyDraft({ ...e, enabled: i });
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
    const n = i.querySelector("input.input");
    n && (n.value = e.value);
  }
  _handleTimeoutChange(t) {
    const e = t.target, i = parseInt(e.value, 10);
    if (Number.isNaN(i)) return;
    const n = Math.max(1, Math.min(120, i));
    e.value = String(n);
    const o = n * 60, a = e.closest(".config-value");
    if (a) {
      const s = a.querySelector("input.timeout-slider");
      s && (s.value = String(n));
      const l = a.querySelector("input.input");
      l && (l.value = String(n));
    }
    if (!this.location || this._isFloorLocation()) return;
    const r = this._getOccupancyConfig();
    this._setOccupancyDraft({ ...r, default_timeout: o });
  }
  _isFloorLocation() {
    return !!this.location && C(this.location) === "floor";
  }
};
$e.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  allLocations: { attribute: !1 },
  adjacencyEdges: { attribute: !1 },
  entryId: { attribute: !1 },
  entityRegistryRevision: { type: Number },
  forcedTab: { type: String },
  occupancyStates: { attribute: !1 },
  occupancyTransitions: { attribute: !1 },
  handoffTraces: { attribute: !1 },
  _climateDeviceLinkRevision: { state: !0 }
}, $e.styles = [
  Qt,
  It`
      :host {
        display: block;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        --inspector-content-max-width: 1120px;
      }

      .inspector-container {
        height: 100%;
        min-height: 0;
        padding: 0 var(--spacing-md);
      }

      .inspector-main {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
        min-width: 0;
      }

      .inspector-top,
      .inspector-body-content,
      .header,
      .tabs,
      .tab-content,
      .recent-events-drawer {
        width: min(100%, var(--inspector-content-max-width));
      }

      .inspector-top {
        align-self: flex-start;
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding-top: var(--spacing-xs);
        padding-bottom: var(--spacing-sm);
        background: var(--card-background-color);
        box-shadow: 0 10px 18px -18px rgba(0, 0, 0, 0.45);
      }

      .inspector-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        padding-bottom: var(--spacing-xl);
      }

      .inspector-body-content {
        align-self: flex-start;
      }

      .recent-events-drawer {
        position: sticky;
        bottom: 0;
        z-index: 4;
        margin-top: var(--spacing-lg);
        width: min(100%, var(--inspector-content-max-width));
        align-self: flex-start;
        border: 1px solid var(--divider-color);
        border-radius: 14px 14px 0 0;
        background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.96);
        backdrop-filter: blur(8px);
        box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .recent-events-drawer.collapsed .recent-events-drawer-body {
        display: none;
      }

      .recent-events-drawer.compact .recent-events-drawer-body {
        max-height: 140px;
      }

      .recent-events-drawer.medium .recent-events-drawer-body {
        max-height: 240px;
      }

      .recent-events-drawer.tall .recent-events-drawer-body {
        max-height: 360px;
      }

      .recent-events-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        background: rgba(var(--rgb-primary-color), 0.05);
        border-bottom: 1px solid var(--divider-color);
      }

      .recent-events-drawer-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .recent-events-drawer-controls {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .recent-events-drawer-body {
        padding: 12px 14px 14px;
        overflow: auto;
      }

      .recent-events-drawer-help {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        margin-bottom: 0;
        padding: var(--spacing-md);
        background-color: var(--card-background-color);
        background-image: linear-gradient(
          rgba(var(--rgb-primary-color), 0.06),
          rgba(var(--rgb-primary-color), 0.06)
        );
        border: 1px solid rgba(var(--rgb-primary-color), 0.08);
        border-radius: var(--border-radius);
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
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

      .header-ambient {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-family: var(--code-font-family, monospace);
      }

      .header-lock-state {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .ambient-grid {
        display: grid;
        grid-template-columns: minmax(150px, 220px) 1fr;
        gap: 8px 12px;
        margin-bottom: var(--spacing-md);
      }

      .ambient-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .ambient-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-status-grid {
        display: grid;
        grid-template-columns: minmax(160px, 220px) 1fr;
        gap: 8px 12px;
      }

      .dusk-status-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .dusk-status-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-target-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 220px;
        overflow-y: auto;
      }

      .dusk-target-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .dusk-target-row code {
        font-size: 11px;
        color: var(--text-secondary-color);
      }

      .dusk-light-actions {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dusk-light-action-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid {
        display: grid;
        grid-template-columns:
          26px
          minmax(170px, 260px)
          minmax(240px, 360px)
          minmax(70px, 100px)
          minmax(140px, 200px);
        gap: 8px;
        align-items: center;
      }

      .dusk-light-action-grid.disabled {
        opacity: 0.65;
      }

      .dusk-light-entity-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .dusk-light-entity-meta code {
        font-size: 11px;
        color: var(--text-secondary-color);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dusk-light-action-grid input[type="color"] {
        width: 44px;
        height: 30px;
        padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid select {
        width: 100%;
      }

      .dusk-light-action-switch {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .dusk-level-control {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .dusk-level-slider {
        width: 100%;
      }

      .dusk-level-value {
        min-width: 38px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .dusk-off-only-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        user-select: none;
      }

      .dusk-off-only-toggle input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }

      .dusk-block-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }

      .dusk-block-row {
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        padding: 16px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .dusk-block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }

      .dusk-block-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .dusk-block-title-button {
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 600;
        padding: 2px 4px;
        cursor: pointer;
        text-align: left;
        border-radius: 6px;
      }

      .dusk-block-title-button:hover {
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .dusk-block-title-input {
        width: min(100%, 380px);
        font-size: 16px;
        font-weight: 600;
      }

      .dusk-rule-row {
        display: grid;
        grid-template-columns: minmax(180px, 230px) minmax(320px, 1fr);
        gap: 12px;
        align-items: center;
        margin-top: 12px;
      }

      .dusk-trigger-groups {
        display: grid;
        gap: 10px;
        width: 100%;
      }

      .dusk-trigger-group {
        display: grid;
        grid-template-columns: minmax(140px, 180px) minmax(220px, 1fr);
        gap: 10px;
        align-items: center;
      }

      .dusk-trigger-group-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--secondary-text-color);
      }

      .lighting-situation-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 10px;
      }

      .lighting-situation-card {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 14px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .lighting-situation-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .lighting-situation-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--primary-text-color);
      }

      .lighting-situation-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .lighting-situation-row {
        display: grid;
        grid-template-columns: minmax(150px, 190px) minmax(260px, 1fr);
        gap: 12px;
        align-items: center;
      }

      .lighting-situation-toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .lighting-situation-help {
        margin-top: 8px;
      }

      .lighting-time-window {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 10px;
      }

      .toggle-choice-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        width: 100%;
      }

      .toggle-choice-enable {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 112px;
        font-size: 13px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .toggle-choice-enable input,
      .choice-pill input {
        margin: 0;
        accent-color: var(--primary-color);
      }

      .choice-pill-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .choice-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 999px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
        cursor: pointer;
        user-select: none;
      }

      .choice-pill.active {
        border-color: rgba(var(--rgb-primary-color), 0.45);
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .choice-pill.disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .dusk-section-heading {
        margin-top: 18px;
        margin-bottom: 8px;
      }

      .dusk-rule-section-title {
        margin-top: 18px;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
        color: var(--primary-text-color);
      }

      .dusk-block-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
      }

      .dusk-rule-footer-help {
        margin-top: 8px;
        text-align: right;
      }

      .dusk-inline-heading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 18px;
        margin-bottom: 6px;
      }

      .dusk-inline-heading-row .dusk-rule-section-title {
        margin: 0;
      }

      .dusk-inline-option-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .dusk-delete-rule-button {
        min-width: 112px;
      }

      .dusk-list-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      .dusk-conditions {
        margin-top: 14px;
        margin-bottom: 20px;
        margin-left: 8px;
        padding-left: 12px;
        border-left: 2px solid rgba(var(--rgb-primary-color), 0.18);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dusk-conditions .config-row {
        grid-template-columns: minmax(220px, 320px) minmax(320px, 1fr);
        padding: 8px 0;
        border-bottom: none;
      }

      .dusk-conditions .config-value {
        width: 100%;
      }

      .dusk-condition-derived {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 500;
      }

      .dusk-condition-derived-note {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 400;
      }

      .dusk-wide-select {
        min-width: 340px;
        width: min(100%, 560px);
        max-width: 560px;
      }

      .dusk-block-grid {
        display: grid;
        grid-template-columns: minmax(120px, 160px) minmax(180px, 1fr);
        gap: 10px;
        align-items: center;
      }

      .dusk-block-grid input[type="time"],
      .dusk-block-grid input[type="number"],
      .dusk-block-grid input[type="text"] {
        width: 100%;
      }

      .dusk-time-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(200px, 260px));
        gap: 12px;
        max-width: 560px;
      }

      .dusk-time-inline {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .dusk-time-inline-fields {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .dusk-time-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 122px;
      }

      .dusk-time-input {
        width: 100%;
        min-height: 36px;
      }

      .dusk-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0 12px;
      }

      .dusk-save-button {
        appearance: none;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 114px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1.2;
      }

      .dusk-save-button.dirty {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: #fff;
      }

      .dusk-save-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .draft-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 0 0 10px;
        max-width: 900px;
      }

      .draft-toolbar-note {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .draft-toolbar-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .sticky-draft-bar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
        padding: 12px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: color-mix(in srgb, var(--card-background-color) 92%, white 8%);
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
      }

      .sticky-draft-bar-note {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .sticky-draft-bar-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }

      .draft-save-button {
        min-width: 124px;
      }

      .draft-toolbar-actions-only {
        justify-content: flex-end;
      }

      .dusk-inline-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .dusk-inline-actions-end {
        justify-content: flex-end;
        margin-top: 14px;
      }

      .section-title-actions .button,
      .dusk-list-footer .button,
      .dusk-inline-actions-end .button {
        min-width: 108px;
        white-space: nowrap;
      }

      .occupancy-explainability {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
      }

      .occupancy-explainability-grid {
        display: grid;
        grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }

      .occupancy-explainability-panel {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 14px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-explainability-panel-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-bottom: 10px;
      }

      .occupancy-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .occupancy-status-chip.is-occupied {
        background: rgba(var(--rgb-success-color), 0.12);
        color: var(--success-color);
      }

      .occupancy-status-chip.is-vacant {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .occupancy-summary-lines {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .occupancy-summary-line {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .occupancy-summary-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .occupancy-summary-value {
        color: var(--primary-text-color);
      }

      .occupancy-events {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .occupancy-event {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr) auto;
        align-items: start;
        gap: 10px;
        font-size: 12px;
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-event-time {
        font-variant-numeric: tabular-nums;
        color: var(--text-secondary-color);
        white-space: nowrap;
      }

      .occupancy-event-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .occupancy-event-source {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .occupancy-event-description {
        color: var(--text-secondary-color);
      }

      .occupancy-event-meta {
        color: var(--text-secondary-color);
        white-space: nowrap;
      }

      .occupancy-empty-state {
        border: 1px dashed var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        color: var(--secondary-text-color);
        background: rgba(var(--rgb-primary-color), 0.02);
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
        width: 100%;
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
        width: 100%;
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

      .section-title-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }

      .section-title-row .section-title {
        margin-bottom: 0;
      }

      .section-title-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .sources-heading {
        margin-bottom: var(--spacing-sm);
        width: 100%;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .sources-heading .section-title {
        margin-bottom: 0;
      }

      .sources-inline-help {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: 0;
        border-bottom: 1px solid var(--divider-color);
        position: relative;
        z-index: 1;
        background-color: var(--card-background-color);
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
        padding: var(--spacing-sm) 0 0;
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
        max-width: min(620px, 100%);
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
        width: 100%;
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

      .dusk-time-field .input {
        width: 132px;
        min-width: 132px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        width: 100%;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        width: 100%;
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
        width: 100%;
      }

      .action-device-list {
        display: grid;
        gap: var(--spacing-sm);
        width: 100%;
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

      .action-name-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex-wrap: wrap;
      }

      .action-entity-inline {
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
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
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        width: 100%;
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

      .source-card-item.grouped {
        border-top: 1px solid var(--divider-color);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        width: 100%;
      }

      .linked-location-list {
        display: grid;
        gap: 8px;
        width: 100%;
      }

      .linked-location-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .linked-location-left,
      .linked-location-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linked-location-left {
        min-width: 0;
      }

      .linked-location-row input[type="checkbox"] {
        margin: 0;
      }

      .linked-location-name {
        font-size: 13px;
        font-weight: 600;
      }

      .linked-location-two-way-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .linked-location-meta {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .advanced-toggle-row {
        display: flex;
        justify-content: flex-end;
        width: 100%;
      }

      .adjacency-list {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        width: 100%;
      }

      .adjacency-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .adjacency-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .adjacency-neighbor {
        font-size: 13px;
        font-weight: 600;
      }

      .adjacency-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .adjacency-delete-btn {
        font-size: 11px;
        padding: 4px 8px;
      }

      .adjacency-empty {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-bottom: 8px;
      }

      .adjacency-form {
        display: grid;
        gap: 10px;
        width: 100%;
      }

      .adjacency-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .adjacency-form-field {
        display: grid;
        gap: 4px;
      }

      .adjacency-form-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .adjacency-form-field input,
      .adjacency-form-field select {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .adjacency-form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .handoff-trace-list {
        display: grid;
        gap: 8px;
        width: 100%;
      }

      .handoff-trace-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .handoff-trace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
      }

      .handoff-trace-route {
        font-weight: 700;
      }

      .handoff-trace-time {
        color: var(--text-secondary-color);
      }

      .handoff-trace-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 8px 10px;
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

      .candidate-entity-inline {
        margin-left: 4px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-submeta {
        margin-top: 6px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 600;
      }

      .light-signal-toggles {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .light-signal-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--primary-text-color);
      }

      .light-signal-toggle input {
        width: 14px;
        height: 14px;
        accent-color: var(--primary-color);
      }

      .candidate-headline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .candidate-controls {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .source-state-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        padding: 2px 8px;
        font-size: 11px;
        color: var(--text-secondary-color);
        text-transform: lowercase;
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
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 8px 10px;
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

      .editor-note {
        color: var(--text-secondary-color);
        font-size: 12px;
        line-height: 1.45;
        padding: 8px 10px;
        border-radius: 6px;
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        width: 100%;
      }

      .external-source-section {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--divider-color);
        width: 100%;
      }

      .external-source-section .section-title-row {
        align-items: flex-start;
        margin-bottom: 0;
      }

      .external-source-section .subsection-title {
        margin-bottom: 4px;
      }

      .external-source-section .subsection-help {
        margin-bottom: 0;
      }

      .external-source-launch {
        flex: 0 0 auto;
      }

      ha-dialog {
        --mdc-dialog-min-width: 540px;
      }

      .external-source-dialog-content {
        display: grid;
        gap: 12px;
        min-width: min(520px, 100%);
      }

      .external-source-dialog-copy {
        color: var(--text-secondary-color);
        font-size: 13px;
        line-height: 1.45;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        width: 100%;
        margin-bottom: 10px;
      }

      .external-composer.is-dialog {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        align-items: start;
        margin-bottom: 0;
      }

      .external-composer.is-dialog .runtime-note,
      .external-composer.is-dialog .policy-warning {
        grid-column: 1 / -1;
        margin: 0;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .wiab-config {
        display: grid;
        gap: 10px;
        width: 100%;
      }

      .wiab-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }

      .wiab-entity-editor {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .wiab-entity-editor label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .wiab-entity-input {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .wiab-entity-input select {
        min-width: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .wiab-chip-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .wiab-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--divider-color);
        border-radius: 999px;
        padding: 2px 8px;
        background: var(--card-background-color);
        font-size: 12px;
      }

      .wiab-chip button {
        border: none;
        background: transparent;
        color: var(--text-secondary-color);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      }

      .wiab-empty {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
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

      .dusk-list-footer .button-primary,
      [data-testid="action-rule-add"].button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
        border: 1px solid var(--primary-color, #03a9f4) !important;
        box-shadow: 0 4px 12px rgba(var(--rgb-primary-color, 3, 169, 244), 0.24);
      }

      .dusk-list-footer .button-primary:hover,
      [data-testid="action-rule-add"].button-primary:hover {
        filter: brightness(0.96);
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .button:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }

      .group-create-button {
        color: var(--text-primary-color, #212121) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .group-create-button.is-ready {
        background: rgba(3, 169, 244, 0.12) !important;
        border-color: var(--primary-color, #03a9f4) !important;
        color: var(--primary-color, #03a9f4) !important;
      }

      .group-create-button:hover {
        background: transparent !important;
      }

      .group-create-button.is-ready:hover {
        background: rgba(3, 169, 244, 0.16) !important;
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

        .external-source-launch {
          width: 100%;
        }

        .external-source-launch .button {
          width: 100%;
          justify-content: center;
        }

        .dusk-block-grid {
          grid-template-columns: 1fr;
        }

        .dusk-rule-row {
          grid-template-columns: 1fr;
        }

        .lighting-situation-row {
          grid-template-columns: 1fr;
        }

        .dusk-wide-select {
          min-width: 0;
          width: 100%;
          max-width: 100%;
        }

        .dusk-conditions {
          margin-left: 0;
          padding-left: 10px;
        }

        .dusk-conditions .config-row {
          grid-template-columns: 1fr;
        }

        .dusk-time-fields {
          grid-template-columns: 1fr;
          max-width: 100%;
        }

        .dusk-time-inline {
          align-items: flex-start;
          width: 100%;
        }

        .dusk-time-inline-fields {
          width: 100%;
        }

        .dusk-light-action-grid {
          grid-template-columns: 1fr;
        }

        .toggle-choice-row {
          align-items: flex-start;
        }

        .dusk-toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .section-title-row {
          flex-direction: column;
          align-items: flex-start;
        }

        .section-title-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .sticky-draft-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .sticky-draft-bar-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .sources-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .occupancy-explainability-grid {
          grid-template-columns: 1fr;
        }

        .occupancy-event {
          grid-template-columns: 1fr;
        }
      }
    `
];
let ci = $e;
if (!customElements.get("ht-location-inspector"))
  try {
    customElements.define("ht-location-inspector", ci);
  } catch (c) {
    console.error("[ht-location-inspector] failed to define element", c);
  }
console.log("[ht-location-dialog] module loaded");
var tn, en;
try {
  (en = (tn = import.meta) == null ? void 0 : tn.hot) == null || en.accept(() => window.location.reload());
} catch {
}
const ke = class ke extends ot {
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
    var e, i, n;
    if (t.has("open")) {
      const o = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", o, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((a) => {
        var r, s;
        return `${a.name}(${(s = (r = a.modules) == null ? void 0 : r._meta) == null ? void 0 : s.type})`;
      })), this.open && !o) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const a = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, r = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (n = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : n.icon : void 0;
          this._config = {
            name: this.location.name,
            type: a.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: r || void 0
          };
        } else {
          const a = this.defaultType ?? "area", r = this.defaultParentId;
          this._config = {
            name: "",
            type: a,
            parent_id: r || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(t) {
    super.updated(t), t.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var n, o;
        const e = (n = this.shadowRoot) == null ? void 0 : n.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const a = e.shadowRoot.querySelector('input[type="text"]');
          if (a) {
            console.log("[LocationDialog] Focusing input:", a), a.focus(), a.select();
            return;
          }
        }
        const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const t = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), g`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? g`
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
    const n = [
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
              { value: "property", label: "Property" },
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
    return i && n.push({
      name: "parent_id",
      selector: {
        select: {
          options: [
            ...e ? [{ value: "", label: "(Root Level)" }] : [],
            ...t
          ]
        }
      }
    }), n.push({
      name: "icon",
      selector: { icon: {} }
    }), n;
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
    const t = this._config.type, e = Qe(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const n = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: n,
      totalLocations: this.locations.length
    }), n.length === 0) return [];
    const o = this._managedShadowLocationIds(), a = this.locations.filter((r) => {
      if (r.is_explicit_root || this._isManagedShadowLocation(r, o)) return !1;
      const s = C(r);
      return n.includes(s);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", a.length, a.map((r) => r.label)), a;
  }
  _isManagedShadowLocation(t, e) {
    return De(t, e);
  }
  _managedShadowLocationIds() {
    return Re(this.locations);
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = Qe(this._config.type);
    if (t.length === 1 && t[0] === "root") return null;
    const i = String(this._config.parent_id || "").trim();
    if (i) return i;
    const n = this._getValidParents();
    return n.length === 1 ? String(n[0].value) : null;
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
ke.properties = {
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
}, ke.styles = [
  Qt,
  It`
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
let li = ke;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", li);
const Ae = class Ae extends ot {
  constructor() {
    super(...arguments), this.locations = [], this.occupancyStates = {}, this.occupancyTransitions = {}, this._collapsed = !1, this._showAllChanges = !1, this._nowEpochMs = Date.now();
  }
  connectedCallback() {
    super.connectedCallback(), this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._clockTimer !== void 0 && (window.clearInterval(this._clockTimer), this._clockTimer = void 0);
  }
  willUpdate(t) {
    t.has("location") && (this._collapsed = !1, this._showAllChanges = !1);
  }
  render() {
    if (!this.location) return "";
    const t = this._recentExplainabilityCurrentState(), e = this._recentExplainabilityChanges(), i = this._showAllChanges ? e : e.slice(0, 5);
    return g`
      <div
        class="dock ${this._collapsed ? "collapsed" : ""}"
        data-testid="room-explainability-panel"
      >
        <div class="dock-card">
          <div class="dock-header">
            <div class="dock-title">
              <ha-icon .icon=${"mdi:timeline-clock-outline"}></ha-icon>
              Occupancy Explainability
            </div>
            <button
              class="button button-secondary"
              type="button"
              style="padding: 2px 8px; font-size: 11px;"
              data-testid="room-explainability-collapse-toggle"
              @click=${() => {
      this._collapsed = !this._collapsed;
    }}
            >
              ${this._collapsed ? "Open" : "Collapse"}
            </button>
          </div>
          <div class="dock-body">
            <div class="dock-help">
              <span>See why this location is in its current state and what changed most recently.</span>
              ${e.length > 5 ? g`
                    <button
                      class="button button-secondary"
                      type="button"
                      style="padding: 2px 8px; font-size: 11px;"
                      data-testid="room-explainability-toggle"
                      @click=${() => {
      this._showAllChanges = !this._showAllChanges;
    }}
                    >
                      ${this._showAllChanges ? "Show less" : "Show all"}
                    </button>
                  ` : ""}
            </div>

            ${!t && e.length === 0 ? g`
                  <div class="occupancy-empty-state">
                    No explainability data is available for this location yet.
                  </div>
                ` : g`
                  <div class="occupancy-explainability">
                    ${t ? g`
                          <div class="occupancy-explainability-grid">
                            <div class="occupancy-explainability-panel">
                              <div class="occupancy-explainability-panel-title">Current state</div>
                              <div
                                class="occupancy-status-chip ${t.occupied ? "is-occupied" : "is-vacant"}"
                              >
                                ${t.occupied ? "Occupied" : "Vacant"}
                              </div>
                              <div class="occupancy-summary-lines">
                                <div class="occupancy-summary-line">
                                  <div class="occupancy-summary-label">Why</div>
                                  <div class="occupancy-summary-value">${t.why}</div>
                                </div>
                                ${t.nextChange ? g`
                                      <div class="occupancy-summary-line">
                                        <div class="occupancy-summary-label">Next change</div>
                                        <div class="occupancy-summary-value">
                                          ${t.nextChange}
                                        </div>
                                      </div>
                                    ` : ""}
                                ${t.lockedSummary ? g`
                                      <div class="occupancy-summary-line">
                                        <div class="occupancy-summary-label">Lock</div>
                                        <div class="occupancy-summary-value">
                                          ${t.lockedSummary}
                                        </div>
                                      </div>
                                    ` : ""}
                              </div>
                            </div>

                            <div class="occupancy-explainability-panel">
                              <div class="occupancy-explainability-panel-title">
                                Active contributors
                              </div>
                              ${t.contributors.length ? g`
                                    <div class="occupancy-contributors">
                                      ${t.contributors.map(
      (n) => g`
                                          <div class="occupancy-contributor">
                                            <div class="occupancy-contributor-head">
                                              <div class="occupancy-contributor-source">
                                                ${n.sourceLabel}
                                              </div>
                                              <div class="occupancy-contributor-state">
                                                ${n.stateLabel}
                                              </div>
                                            </div>
                                            ${n.timeLabel ? g`
                                                  <div class="occupancy-contributor-meta">
                                                    Last update ${n.timeLabel}
                                                  </div>
                                                ` : ""}
                                          </div>
                                        `
    )}
                                    </div>
                                  ` : g`
                                    <div class="occupancy-empty-state">
                                      No active contributors are keeping this location occupied
                                      right now.
                                    </div>
                                  `}
                            </div>
                          </div>
                        ` : ""}

                    <div class="occupancy-explainability-panel">
                      <div class="occupancy-explainability-panel-title">Recent changes</div>
                      ${i.length ? g`
                            <div class="occupancy-events">
                              ${i.map(
      (n) => g`
                                  <div class="occupancy-event">
                                    <div class="occupancy-event-time">${n.timeLabel}</div>
                                    <div class="occupancy-event-copy">
                                      <div class="occupancy-event-source">${n.title}</div>
                                      <div class="occupancy-event-description">
                                        ${n.description}
                                      </div>
                                      <div class="occupancy-event-meta">
                                        ${n.relativeTime}
                                      </div>
                                    </div>
                                  </div>
                                `
    )}
                            </div>
                          ` : g`
                            <div class="occupancy-empty-state">
                              No recent occupancy changes are available yet.
                            </div>
                          `}
                    </div>
                  </div>
                `}
          </div>
        </div>
      </div>
    `;
  }
  _getOccupancyConfig() {
    var e, i;
    const t = (i = (e = this.location) == null ? void 0 : e.modules) == null ? void 0 : i.occupancy;
    return {
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      ...t && typeof t == "object" ? t : {}
    };
  }
  _getOccupancyState() {
    if (!this.location) return;
    const t = Je(this.location, this.locations);
    return this._getOccupancyStateForLocation(t);
  }
  _getOccupancyStateForLocation(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if (o.device_class === "occupancy" && o.location_id === t)
        return n;
    }
  }
  _descendantLocationIds(t) {
    const e = /* @__PURE__ */ new Map();
    for (const o of this.locations || [])
      o.parent_id && (e.has(o.parent_id) || e.set(o.parent_id, []), e.get(o.parent_id).push(o.id));
    const i = [], n = [...e.get(t) || []];
    for (; n.length; ) {
      const o = n.pop();
      i.push(o), n.push(...e.get(o) || []);
    }
    return i;
  }
  _aggregateOccupiedState() {
    if (!this.location) return;
    const t = this._resolveOccupiedState(this._getOccupancyState());
    if (t === !0) return !0;
    const e = this._descendantLocationIds(this.location.id);
    if (!e.length) return t;
    const i = e.map((n) => {
      var o;
      return (o = this.occupancyStates) == null ? void 0 : o[n];
    }).filter((n) => typeof n == "boolean");
    return i.includes(!0) ? !0 : t === !1 || i.length > 0 && i.every((n) => n === !1) ? !1 : t;
  }
  _aggregateContributors() {
    const t = this._occupancyContributions(this._getOccupancyConfig(), !0);
    if (t.length) return t;
    if (!this.location) return [];
    const e = /* @__PURE__ */ new Set();
    return this._descendantLocationIds(this.location.id).flatMap((n) => {
      var d, u;
      if (((d = this.occupancyStates) == null ? void 0 : d[n]) !== !0) return [];
      const o = (this.locations || []).find((p) => p.id === n), a = this._getOccupancyStateForLocation(n), r = {
        default_timeout: 300,
        default_trailing_timeout: 120,
        occupancy_sources: [],
        ...(u = o == null ? void 0 : o.modules) != null && u.occupancy && typeof o.modules.occupancy == "object" ? o.modules.occupancy : {}
      }, s = (a == null ? void 0 : a.attributes) || {};
      return (Array.isArray(s.contributions) ? s.contributions : []).map((p) => {
        if (!this._isContributionActive(p)) return;
        const _ = typeof (p == null ? void 0 : p.source_id) == "string" && p.source_id ? p.source_id : typeof (p == null ? void 0 : p.source) == "string" && p.source ? p.source : "";
        if (!_) return;
        const h = `${n}::${_}`;
        if (e.has(h)) return;
        e.add(h);
        const f = this._parseDateValue(p == null ? void 0 : p.updated_at) || this._parseDateValue(p == null ? void 0 : p.changed_at) || this._parseDateValue(p == null ? void 0 : p.last_changed) || this._parseDateValue(p == null ? void 0 : p.timestamp), m = String((p == null ? void 0 : p.state) || (p == null ? void 0 : p.state_value) || "").trim() || "active";
        return {
          sourceLabel: `${(o == null ? void 0 : o.name) || n}: ${this._sourceLabelForSourceId(
            r,
            _
          )}`,
          sourceId: _,
          stateLabel: m,
          timeLabel: f ? `${this._formatElapsedDuration(f)} ago` : void 0,
          timestampMs: f ? f.getTime() : this._nowEpochMs
        };
      }).filter(
        (p) => !!p
      );
    }).sort((n, o) => o.timestampMs - n.timestampMs).map(({ sourceLabel: n, sourceId: o, stateLabel: a, timeLabel: r }) => ({
      sourceLabel: n,
      sourceId: o,
      stateLabel: a,
      timeLabel: r
    }));
  }
  _resolveOccupiedState(t) {
    var r, s, l, d;
    const e = this.location ? Je(this.location, this.locations) : void 0, i = e ? (r = this.occupancyTransitions) == null ? void 0 : r[e] : void 0, n = (s = this._parseDateValue(i == null ? void 0 : i.changedAt)) == null ? void 0 : s.getTime(), o = (l = this._parseDateValue(
      (t == null ? void 0 : t.last_changed) || (t == null ? void 0 : t.last_updated)
    )) == null ? void 0 : l.getTime();
    if (i && typeof i.occupied == "boolean" && (o === void 0 || n !== void 0 && n > o))
      return i.occupied;
    if ((t == null ? void 0 : t.state) === "on") return !0;
    if ((t == null ? void 0 : t.state) === "off") return !1;
    const a = e ? (d = this.occupancyStates) == null ? void 0 : d[e] : void 0;
    if (typeof a == "boolean") return a;
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = Array.isArray(e.locked_by) ? e.locked_by.map((a) => String(a)) : [], n = Array.isArray(e.lock_modes) ? e.lock_modes.map((a) => String(a)) : [], o = Array.isArray(e.direct_locks) ? e.direct_locks.map((a) => ({
      sourceId: String((a == null ? void 0 : a.source_id) || "unknown"),
      mode: String((a == null ? void 0 : a.mode) || "freeze"),
      scope: String((a == null ? void 0 : a.scope) || "self")
    })) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: i,
      lockModes: n,
      directLocks: o
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i) return i;
    const n = Array.isArray(t.contributions) ? t.contributions : [];
    let o = !1, a;
    for (const r of n) {
      const s = r == null ? void 0 : r.expires_at;
      if (s == null) {
        o = !0;
        continue;
      }
      const l = this._parseDateValue(s);
      l && (!a || l.getTime() > a.getTime()) && (a = l);
    }
    return o ? null : a;
  }
  _resolveVacancyReason(t, e) {
    var o, a, r;
    if (e !== !1) return;
    const i = (o = this.location) == null ? void 0 : o.id;
    if (!i) return;
    const n = (a = this.occupancyTransitions) == null ? void 0 : a[i];
    if ((n == null ? void 0 : n.occupied) === !1) {
      const s = this._formatOccupancyReason(n.reason, "vacancy");
      if (s) return s;
    }
    return this._formatOccupancyReason((r = t == null ? void 0 : t.attributes) == null ? void 0 : r.reason, "vacancy");
  }
  _resolveOccupiedReason(t, e) {
    var r, s, l;
    if (e !== !0) return;
    const i = (r = this.location) == null ? void 0 : r.id;
    if (!i) return;
    const n = (s = this.occupancyTransitions) == null ? void 0 : s[i];
    if ((n == null ? void 0 : n.occupied) === !0) {
      const d = this._formatOccupancyReason(n.reason, "occupied");
      if (d) return d;
    }
    const o = this._formatOccupancyReason(
      (l = t == null ? void 0 : t.attributes) == null ? void 0 : l.reason,
      "occupied"
    );
    if (o) return o;
    const a = this._occupancyContributions(this._getOccupancyConfig(), !0);
    return a.length ? `Currently held by ${a[0].sourceLabel}` : "Active source events detected";
  }
  _formatOccupancyReason(t, e) {
    if (typeof t != "string") return;
    const i = t.trim();
    if (!i) return;
    const n = i.toLowerCase();
    if (n === "timeout")
      return e === "occupied" ? void 0 : "Vacated by timeout";
    if (n === "propagation:parent")
      return e === "occupied" ? void 0 : "Vacated because the parent location cleared";
    if (n.startsWith("propagation:child:")) {
      const o = i.split(":").slice(2).join(":").trim();
      return e === "occupied" ? void 0 : o ? `Vacated because child location ${this._locationName(o)} cleared` : "Vacated because a child location cleared";
    }
    if (n.startsWith("event:")) {
      const o = n.split(":", 2)[1];
      if (o === "clear") return e === "occupied" ? void 0 : "Vacated by clear event";
      if (o === "vacate") return e === "occupied" ? void 0 : "Vacated explicitly";
      if (o === "trigger" || o === "handoff" || o === "inherit")
        return e === "vacancy" ? void 0 : this._formatOccupancyEventReason(o, "occupied");
      if (o)
        return this._formatOccupancyEventReason(
          o,
          e === "occupied" ? "occupied" : "vacancy"
        );
    }
    if (n.startsWith("occupancy:")) {
      const o = n.split(":", 2)[1];
      if (o)
        return e === "vacancy" ? void 0 : this._formatOccupancyEventReason(o, "occupied");
    }
    return e === "occupied" ? `Occupied: ${i}` : e === "vacancy" ? `Vacated: ${i}` : `Reason: ${i}`;
  }
  _recentExplainabilityCurrentState() {
    const t = this._getOccupancyState();
    if (!t) return;
    const e = this._aggregateOccupiedState(), i = e === !0, n = t.attributes || {}, o = this._aggregateContributors(), a = this._resolveVacantAt(n, i), r = this._getLockState(), s = e === !0 ? this._resolveOccupiedReason(t, this._resolveOccupiedState(t)) || (o.length ? `Occupied via ${o[0].sourceLabel}` : "Active source events detected") : this._resolveVacancyReason(t, !1) || "No active contributors remain";
    let l;
    i && (a === null ? l = "No timeout scheduled" : a instanceof Date && (l = `Vacates ${this._formatDateTime(a)}`));
    let d;
    return r.isLocked && (d = r.lockedBy.length ? `Held by ${r.lockedBy.join(", ")}` : "Occupancy is held by a lock"), {
      occupied: i,
      why: s,
      nextChange: l,
      lockedSummary: d,
      contributors: o
    };
  }
  _recentExplainabilityChanges() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {};
    return (Array.isArray(e.recent_changes) ? e.recent_changes : []).map((n) => this._normalizeExplainabilityChange(n)).filter((n) => !!n).map((n) => {
      const o = this._parseDateValue(n.changedAt), a = n.sourceId ? this._sourceLabelForSourceId(this._getOccupancyConfig(), n.sourceId) : void 0;
      return {
        title: this._explainabilityChangeTitle(n),
        description: this._explainabilityChangeDescription(n, a),
        timeLabel: o ? this._formatTimeOnly(o) : "Now",
        relativeTime: o ? `${this._formatElapsedDuration(o)} ago` : "just now",
        changedAtMs: (o == null ? void 0 : o.getTime()) || this._nowEpochMs
      };
    }).sort((n, o) => o.changedAtMs - n.changedAtMs);
  }
  _normalizeExplainabilityChange(t) {
    if (!t || typeof t != "object") return;
    const e = t.kind === "signal" ? "signal" : t.kind === "state" ? "state" : void 0, i = typeof t.event == "string" ? t.event.trim().toLowerCase() : "";
    if (!(!e || !i))
      return {
        kind: e,
        event: i,
        sourceId: typeof t.source_id == "string" && t.source_id.trim() ? t.source_id.trim() : void 0,
        reason: typeof t.reason == "string" && t.reason.trim() ? t.reason.trim() : void 0,
        occupied: typeof t.occupied == "boolean" ? t.occupied : void 0,
        changedAt: typeof t.changed_at == "string" && t.changed_at.trim() ? t.changed_at : void 0
      };
  }
  _explainabilityChangeTitle(t) {
    return t.kind === "state" ? t.event === "occupied" ? "Location became occupied" : "Location became vacant" : t.event === "trigger" ? "Source triggered" : t.event === "clear" ? "Source cleared" : t.event === "vacate" ? "Vacate requested" : `Source ${t.event}`;
  }
  _explainabilityChangeDescription(t, e) {
    if (t.kind === "state")
      return this._formatOccupancyReason(
        t.reason,
        t.event === "occupied" ? "occupied" : "vacancy"
      ) || (t.event === "occupied" ? "Occupancy turned on" : "Occupancy turned off");
    const i = e ? `${e}${t.sourceId && e !== t.sourceId ? ` (${t.sourceId})` : ""}` : t.sourceId || "Unknown source";
    return t.event === "trigger" ? `${i} reported activity` : t.event === "clear" ? `${i} cleared its contribution` : t.event === "vacate" ? `${i} requested vacancy` : `${i} reported ${t.event}`;
  }
  _formatOccupancyEventReason(t, e) {
    const i = e === "occupied" ? "Occupied by" : "Vacated by";
    return t === "handoff" ? `${i} room handoff` : t === "trigger" ? `${i} trigger` : t === "inherit" ? `${i} inherited state` : `${i} ${t} event`;
  }
  _occupancyContributions(t, e = !1) {
    const i = this._getOccupancyState();
    if (!i) return [];
    const n = i.attributes || {}, a = (Array.isArray(n.contributions) ? n.contributions : []).map((s) => {
      const l = typeof (s == null ? void 0 : s.source_id) == "string" && s.source_id ? s.source_id : typeof (s == null ? void 0 : s.source) == "string" && s.source ? s.source : "";
      if (!l) return;
      const d = this._sourceLabelForSourceId(t, l), u = String((s == null ? void 0 : s.state) || (s == null ? void 0 : s.state_value) || "").trim() || "active", p = this._parseDateValue(s == null ? void 0 : s.updated_at) || this._parseDateValue(s == null ? void 0 : s.changed_at) || this._parseDateValue(s == null ? void 0 : s.last_changed) || this._parseDateValue(s == null ? void 0 : s.timestamp), _ = this._isContributionActive(s);
      return {
        sourceLabel: d,
        sourceId: l,
        stateLabel: u,
        timeLabel: p ? `${this._formatElapsedDuration(p)} ago` : void 0,
        timestampMs: p ? p.getTime() : this._nowEpochMs,
        active: _
      };
    }).filter(
      (s) => !!s
    ).sort((s, l) => s.active !== l.active ? s.active ? -1 : 1 : l.timestampMs - s.timestampMs);
    return (e ? a.filter((s) => s.active) : a).map(({ sourceLabel: s, stateLabel: l, timeLabel: d, sourceId: u }) => ({
      sourceLabel: s === u || this._structuralSourceLabel(u) ? s : `${s} (${u})`,
      sourceId: u,
      stateLabel: l,
      timeLabel: d
    }));
  }
  _isContributionActive(t) {
    if (!t) return !1;
    const e = String(t.state || t.value || "").toLowerCase();
    if (e === "on" || e === "active" || e === "occupied" || e === "trigger")
      return !0;
    const i = this._parseDateValue(t.expires_at);
    return !!(i && i.getTime() > this._nowEpochMs);
  }
  _sourceLabelForSourceId(t, e) {
    const i = this._structuralSourceLabel(e);
    if (i)
      return i;
    const n = (t.occupancy_sources || []).find(
      (o) => o.source_id === e || o.entity_id === e
    );
    if (n)
      return this._sourceDisplayLabel(n.entity_id, n.signal_key);
    if (e.includes("::")) {
      const [o] = e.split("::");
      return this._sourceDisplayLabel(o);
    }
    return this._entityName(e);
  }
  _structuralSourceLabel(t) {
    const e = String(t || "").trim();
    if (!e) return;
    const i = (n, o, a) => {
      const r = `${n}${o}`;
      if (!e.startsWith(r)) return;
      const s = e.slice(r.length).trim();
      if (s)
        return `${a}: ${this._locationName(s)}`;
    };
    return i("__child__", ":", "Child location") || i("__child__", ".", "Child location") || i("__follow__", ":", "Parent location") || i("__follow__", ".", "Parent location") || (e.startsWith("linked:") ? `Linked location: ${this._locationName(e.slice(7).trim())}` : void 0) || this._knownLocationLabel(e);
  }
  _knownLocationLabel(t) {
    const e = String(t || "").trim();
    if (!e) return;
    const i = (this.locations || []).find((a) => a.id === e);
    if (!i) return;
    const n = C(i);
    return `${n === "building" ? "Building" : n === "grounds" ? "Grounds" : n === "floor" ? "Floor" : "Location"}: ${i.name}`;
  }
  _locationName(t) {
    const e = (this.locations || []).find((i) => i.id === t);
    return (e == null ? void 0 : e.name) || t;
  }
  _sourceDisplayLabel(t, e) {
    const i = this._entityName(t);
    return e ? `${i} ${{
      playback: "playback",
      volume: "volume",
      mute: "mute",
      power: "power",
      level: "brightness",
      color: "color"
    }[e] || e}` : i;
  }
  _entityName(t) {
    var e, i, n, o;
    return ((o = (n = (i = (e = this.hass) == null ? void 0 : e.states) == null ? void 0 : i[t]) == null ? void 0 : n.attributes) == null ? void 0 : o.friendly_name) || t;
  }
  _parseDateValue(t) {
    if (t instanceof Date && !Number.isNaN(t.getTime())) return t;
    if (typeof t == "number" && Number.isFinite(t)) {
      const i = t > 1e12 ? t : t * 1e3, n = new Date(i);
      return Number.isNaN(n.getTime()) ? void 0 : n;
    }
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
  _formatTimeOnly(t) {
    return new Intl.DateTimeFormat(void 0, {
      timeStyle: "short"
    }).format(t);
  }
  _formatElapsedDuration(t) {
    const e = Math.max(0, Math.floor((this._nowEpochMs - t.getTime()) / 1e3));
    if (e <= 0) return "just now";
    const i = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), a = e % 60, r = [];
    return i > 0 && r.push(`${i}d`), n > 0 && r.push(`${n}h`), o > 0 && r.length < 2 && r.push(`${o}m`), (r.length === 0 || i === 0 && n === 0 && o === 0) && r.push(`${a}s`), r.slice(0, 2).join(" ");
  }
};
Ae.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  occupancyStates: { attribute: !1 },
  occupancyTransitions: { attribute: !1 },
  _collapsed: { state: !0 },
  _showAllChanges: { state: !0 },
  _nowEpochMs: { state: !0 }
}, Ae.styles = [
  Qt,
  It`
      :host {
        display: block;
        border-top: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }

      .dock {
        padding: 12px;
      }

      .dock-card {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.98);
        overflow: hidden;
      }

      .dock-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.05);
        border-bottom: 1px solid var(--divider-color);
      }

      .dock-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--primary-text-color);
      }

      .dock-body {
        padding: 12px;
        height: clamp(180px, 280px, 60vh);
        min-height: 180px;
        max-height: 60vh;
        resize: vertical;
        overflow: auto;
      }

      .dock.collapsed .dock-body {
        display: none;
      }

      .dock-help {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .occupancy-explainability {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .occupancy-explainability-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .occupancy-explainability-panel {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 12px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-explainability-panel-title {
        margin-bottom: 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .occupancy-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
      }

      .occupancy-status-chip.is-occupied {
        background: rgba(var(--rgb-success-color), 0.12);
        color: var(--success-color);
      }

      .occupancy-status-chip.is-vacant {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .occupancy-summary-lines {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .occupancy-summary-line {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .occupancy-summary-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .occupancy-summary-value {
        color: var(--primary-text-color);
      }

      .occupancy-events {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .occupancy-contributors {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .occupancy-contributor {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-contributor-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .occupancy-contributor-source {
        font-weight: 600;
        color: var(--primary-text-color);
        overflow-wrap: anywhere;
      }

      .occupancy-contributor-state {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: rgba(var(--rgb-success-color), 0.1);
        color: var(--success-color);
        white-space: nowrap;
      }

      .occupancy-contributor-meta {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .occupancy-event {
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
        color: var(--primary-text-color);
        font-size: 12px;
      }

      .occupancy-event-time {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        color: var(--text-secondary-color);
      }

      .occupancy-event-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .occupancy-event-source {
        font-weight: 600;
      }

      .occupancy-event-description,
      .occupancy-event-meta {
        color: var(--text-secondary-color);
      }

      .occupancy-empty-state {
        border: 1px dashed var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        color: var(--secondary-text-color);
        background: rgba(var(--rgb-primary-color), 0.02);
      }
    `
];
let di = Ae;
customElements.get("ht-room-explainability") || customElements.define("ht-room-explainability", di);
const Yi = "topomation:panel-tree-split", Xi = "topomation:panel-right-mode", Ge = 0.4, Ke = 0.25, Ye = 0.75, aa = "application/x-topomation-entity-id";
var nn, on;
try {
  (on = (nn = import.meta) == null ? void 0 : nn.hot) == null || on.accept(() => window.location.reload());
} catch {
}
const Te = class Te extends ot {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._occupancyStateByLocation = {}, this._occupancyTransitionByLocation = {}, this._adjacencyEdges = [], this._handoffTraceByLocation = {}, this._treePanelSplit = Ge, this._isResizingPanels = !1, this._entityAreaById = {}, this._entitySearch = "", this._assignBusyByEntityId = {}, this._rightPanelMode = "inspector", this._assignmentFilter = "all", this._deviceGroupExpanded = {}, this._haRegistryRevision = 0, this._hasLoaded = !1, this._loadSeq = 0, this._entityAreaIndexLoaded = !1, this._entityAreaRevision = 0, this._deviceGroupsCache = [], this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._resumeRefreshQueued = !1, this._handleDeviceSearch = (t) => {
      var i;
      const e = ((i = t.target) == null ? void 0 : i.value) ?? "";
      this._entitySearch = e;
    }, this._handleEntityDropped = (t) => {
      var n, o;
      t.stopPropagation();
      const e = (n = t.detail) == null ? void 0 : n.entityId, i = (o = t.detail) == null ? void 0 : o.targetLocationId;
      !e || !i || this._assignEntityToLocation(e, i);
    }, this._handleNewLocation = (t) => {
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
      if (this._pendingDeleteSelectedId !== e.id) {
        this._pendingDeleteSelectedId = e.id, this._showToast(`Click Confirm Delete to remove "${e.name}"`, "warning");
        return;
      }
      this._pendingDeleteSelectedId = void 0, this._handleLocationDelete(
        new CustomEvent("location-delete", {
          detail: { location: e }
        })
      );
    }, this._handleKeyDown = (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "s" && (t.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (t.ctrlKey || t.metaKey) && t.key === "z" && !t.shiftKey && t.preventDefault(), (t.ctrlKey || t.metaKey) && (t.key === "y" || t.key === "z" && t.shiftKey) && t.preventDefault(), t.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), t.key === "?" && !t.ctrlKey && !t.metaKey && this._showKeyboardShortcutsHelp();
    }, this._handleOpenSidebar = () => {
      this.dispatchEvent(
        new CustomEvent("hass-toggle-menu", {
          bubbles: !0,
          composed: !0,
          detail: { open: !0 }
        })
      );
    }, this._handleVisibilityChange = () => {
      document.visibilityState === "visible" && this._queueResumeRefresh();
    }, this._handleWindowFocus = () => {
      this._queueResumeRefresh();
    }, this._handlePageShow = () => {
      this._queueResumeRefresh();
    }, this._handleOnline = () => {
      this._queueResumeRefresh();
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
        t.preventDefault(), this._setPanelSplit(Ke, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(Ye, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(Ge, !0);
    };
  }
  _enqueueLocationOp(t, e) {
    const n = (this._opQueueByLocationId.get(t) ?? Promise.resolve()).catch(() => {
    }).then(e);
    return this._opQueueByLocationId.set(t, n), n;
  }
  _scheduleReload(t = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(t);
    }, 150);
  }
  willUpdate(t) {
    var e;
    if (super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, this._loadLocations()), t.has("hass")) {
      const i = t.get("hass"), n = i == null ? void 0 : i.connection, o = (e = this.hass) == null ? void 0 : e.connection;
      n !== o && (o ? this._subscribeToUpdates() : (this._teardownUpdateSubscriptions(), this._updatesSubscriptionConnection = void 0));
    }
  }
  connectedCallback() {
    super.connectedCallback(), this._restorePanelSplitPreference(), this._restoreRightPanelModePreference(), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown), document.addEventListener("visibilitychange", this._handleVisibilityChange), window.addEventListener("focus", this._handleWindowFocus), window.addEventListener("pageshow", this._handlePageShow), window.addEventListener("online", this._handleOnline);
  }
  updated(t) {
    if (super.updated(t), t.has("_selectedId")) {
      const e = this._selectedId || void 0;
      this._pendingDeleteSelectedId && this._pendingDeleteSelectedId !== e && (this._pendingDeleteSelectedId = void 0);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), document.removeEventListener("visibilitychange", this._handleVisibilityChange), window.removeEventListener("focus", this._handleWindowFocus), window.removeEventListener("pageshow", this._handlePageShow), window.removeEventListener("online", this._handleOnline), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._resumeRetryTimer && (clearTimeout(this._resumeRetryTimer), this._resumeRetryTimer = void 0), this._registryRefreshTimer && (clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._teardownUpdateSubscriptions(), this._updatesSubscriptionConnection = void 0;
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
      return g`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return g`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (d) => d.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), n = e === "location" ? void 0 : e, o = "Automation", a = this._deleteDisabledReason(t), r = !!t && this._pendingDeleteSelectedId === (t == null ? void 0 : t.id), s = this._canDeleteLocation(t), l = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return g`
      <div class="panel-container" style=${`--tree-panel-basis: ${l};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${this._isSplitStackedLayout() ? g`
                    <button
                      class="button button-secondary icon-button"
                      @click=${this._handleOpenSidebar}
                      data-testid="mobile-sidebar-button"
                      aria-label="Open Home Assistant sidebar"
                      title="Open Home Assistant sidebar"
                    >
                      <ha-icon .icon=${"mdi:menu"}></ha-icon>
                    </button>
                  ` : ""}
              ${g`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${a}
                ?disabled=${!s}
                data-testid="delete-selected-button"
              >
                ${r ? "Confirm Delete" : "Delete Selected"}
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
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
            @entity-dropped=${this._handleEntityDropped}
          ></ht-location-tree>
          ${t ? g`
                <ht-room-explainability
                  .hass=${this.hass}
                  .location=${t}
                  .locations=${this._locations}
                  .occupancyStates=${this._occupancyStateByLocation}
                  .occupancyTransitions=${this._occupancyTransitionByLocation}
                ></ht-room-explainability>
              ` : ""}
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(Ke * 100)}
          aria-valuemax=${Math.round(Ye * 100)}
          aria-valuenow=${Math.round(this._treePanelSplit * 100)}
          tabindex="0"
          title="Drag to resize panes. Double-click to reset."
          @pointerdown=${this._handlePanelSplitterPointerDown}
          @keydown=${this._handlePanelSplitterKeyDown}
          @dblclick=${this._handlePanelSplitterReset}
        ></div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${o}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${t}
            .allLocations=${this._locations}
            .adjacencyEdges=${this._adjacencyEdges}
            .entryId=${this._activeEntryId()}
            .entityRegistryRevision=${this._haRegistryRevision}
            .forcedTab=${n}
            .occupancyStates=${this._occupancyStateByLocation}
            .occupancyTransitions=${this._occupancyTransitionByLocation}
            .handoffTraces=${t ? this._handoffTraceByLocation[t.id] || [] : []}
            @adjacency-changed=${this._handleAdjacencyChanged}
            @location-meta-changed=${this._handleLocationMetaChanged}
          ></ht-location-inspector>
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-appliances") || t.startsWith("/topomation-appliance") ? "appliances" : t.startsWith("/topomation-media") ? "media" : t.startsWith("/topomation-hvac") ? "hvac" : "location";
  }
  _managerView() {
    var e, i, n;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "appliances" || t === "media" || t === "hvac" ? t : (n = this.route) != null && n.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return {
      title: "Topology",
      subtitle: "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation."
    };
  }
  _renderDialogs() {
    var t, e;
    return g`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._parentSelectableLocations()}
        .entryId=${this._activeEntryId()}
        .defaultParentId=${(t = this._newLocationDefaults) == null ? void 0 : t.parentId}
        .defaultType=${(e = this._newLocationDefaults) == null ? void 0 : e.type}
        @dialog-closed=${() => {
      this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>
    `;
  }
  async _ensureEntityAreaIndex(t = !1) {
    var e;
    if ((e = this.hass) != null && e.callWS && !(!t && this._entityAreaIndexLoaded)) {
      if (this._entityAreaIndexPromise) {
        await this._entityAreaIndexPromise;
        return;
      }
      this._entityAreaIndexPromise = (async () => {
        try {
          const [i, n] = await Promise.all([
            this.hass.callWS({ type: "config/entity_registry/list" }),
            this.hass.callWS({ type: "config/device_registry/list" })
          ]), o = /* @__PURE__ */ new Map();
          if (Array.isArray(n))
            for (const u of n) {
              const p = typeof (u == null ? void 0 : u.id) == "string" ? u.id : void 0, _ = typeof (u == null ? void 0 : u.area_id) == "string" ? u.area_id : void 0;
              p && _ && o.set(p, _);
            }
          const a = {};
          if (Array.isArray(i))
            for (const u of i) {
              const p = typeof (u == null ? void 0 : u.entity_id) == "string" ? u.entity_id : void 0;
              if (!p) continue;
              const _ = typeof (u == null ? void 0 : u.area_id) == "string" ? u.area_id : void 0, h = typeof (u == null ? void 0 : u.device_id) == "string" ? o.get(u.device_id) : void 0;
              a[p] = _ || h || null;
            }
          const r = this._entityAreaById, s = Object.keys(r), l = Object.keys(a);
          (s.length !== l.length || l.some((u) => r[u] !== a[u])) && (this._entityAreaById = a, this._entityAreaRevision += 1), this._entityAreaIndexLoaded = !0;
        } catch {
        }
      })();
      try {
        await this._entityAreaIndexPromise;
      } finally {
        this._entityAreaIndexPromise = void 0;
      }
    }
  }
  _renderDeviceAssignmentPanel(t) {
    const e = !this._entityAreaIndexLoaded && !!this._entityAreaIndexPromise, i = this._buildDeviceGroups(), n = this._prioritizeDeviceGroupsForSelection(
      this._visibleDeviceGroups(i),
      t == null ? void 0 : t.id
    ), o = this._assignmentFilterStats(i), a = t ? t.name : "Select a location";
    return g`
      <div class="device-assignment-panel">
        <div class="device-panel-head">
          <div class="device-panel-title">Device Assignment</div>
          <div class="device-panel-subtitle">
            Assign target: <strong>${a}</strong>
          </div>
          <input
            class="device-search"
            type="search"
            .value=${this._entitySearch}
            placeholder="Search devices..."
            @input=${this._handleDeviceSearch}
          />
          <div class="device-toolbar">
            <div class="device-filter-group">
              <button
                class="button ${this._assignmentFilter === "all" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("all")}
              >
                All (${o.all})
              </button>
              <button
                class="button ${this._assignmentFilter === "unassigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("unassigned")}
              >
                Unassigned (${o.unassigned})
              </button>
              <button
                class="button ${this._assignmentFilter === "assigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("assigned")}
              >
                Assigned (${o.assigned})
              </button>
            </div>
            <div class="device-group-actions">
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!0, n)}>
                Expand all
              </button>
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!1, n)}>
                Collapse all
              </button>
            </div>
          </div>
        </div>
        ${e ? g`<div class="device-empty">Loading area mapping…</div>` : ""}

        ${n.length === 0 ? g`<div class="device-empty">No devices match the current filter.</div>` : n.map((r) => this._renderDeviceGroup(r, t == null ? void 0 : t.id))}
      </div>
    `;
  }
  _renderDeviceGroup(t, e) {
    const i = this._isGroupExpanded(t.key);
    return g`
      <section class="device-group" data-testid=${`device-group-${t.key}`}>
        <button
          class="device-group-header"
          @click=${() => this._toggleDeviceGroup(t.key)}
          aria-expanded=${i}
          aria-label=${`Toggle ${t.label} devices`}
        >
          <span class="device-group-header-left">
            <span class="device-group-chevron">${i ? "▾" : "▸"}</span>
            <span class="device-group-label">${t.label}</span>
          </span>
          <span class="device-group-count">${t.entities.length}</span>
        </button>
        ${i ? t.entities.length === 0 ? g`<div class="device-empty">No devices in this group.</div>` : t.entities.map((n) => {
      const o = !!this._assignBusyByEntityId[n], a = this._entityDisplayName(n);
      return g`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${n}
                  @dragstart=${(r) => this._handleDeviceDragStart(r, n)}
                >
                  <div>
                    <div class="device-name">${a}</div>
                    <div class="device-meta">${this._deviceMetaForGroup(n, t)}</div>
                  </div>
                  <button
                    class="button button-secondary device-assign-btn"
                    ?disabled=${!e || o}
                    @click=${() => this._handleAssignButton(n, e)}
                  >
                    ${o ? "Assigning..." : "Assign"}
                  </button>
                </div>
              `;
    }) : ""}
      </section>
    `;
  }
  _handleAssignmentFilterChange(t) {
    this._assignmentFilter = t;
  }
  _assignmentFilterStats(t) {
    const e = t.filter((n) => n.type === "unassigned").reduce((n, o) => n + o.entities.length, 0), i = t.filter((n) => n.type !== "unassigned").reduce((n, o) => n + o.entities.length, 0);
    return { all: e + i, unassigned: e, assigned: i };
  }
  _visibleDeviceGroups(t) {
    return this._assignmentFilter === "all" ? t : this._assignmentFilter === "unassigned" ? t.filter((e) => e.type === "unassigned") : t.filter((e) => e.type !== "unassigned");
  }
  _prioritizeDeviceGroupsForSelection(t, e) {
    if (!e || t.length <= 1) return t;
    const i = t.findIndex((o) => o.locationId === e);
    return i <= 0 ? t : [t[i], ...t.slice(0, i), ...t.slice(i + 1)];
  }
  _isGroupExpanded(t) {
    const e = this._deviceGroupExpanded[t];
    return typeof e == "boolean" ? e : t === "unassigned";
  }
  _toggleDeviceGroup(t) {
    const e = this._isGroupExpanded(t);
    this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [t]: !e
    };
  }
  _setAllDeviceGroups(t, e) {
    const i = { ...this._deviceGroupExpanded };
    for (const n of e)
      i[n.key] = t;
    this._deviceGroupExpanded = i;
  }
  _deviceMetaForGroup(t, e) {
    if (e.type !== "unassigned")
      return t;
    const i = this._areaLabel(this._effectiveAreaIdForEntity(t));
    return i === "Unassigned" ? t : `${t} · HA Area: ${i}`;
  }
  _handleDeviceDragStart(t, e) {
    var i, n;
    (i = t.dataTransfer) == null || i.setData(aa, e), (n = t.dataTransfer) == null || n.setData("text/plain", e), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
  }
  _handleAssignButton(t, e) {
    if (!e) {
      this._showToast("Select a location first", "warning");
      return;
    }
    this._assignEntityToLocation(t, e);
  }
  _allKnownEntityIds() {
    var e;
    const t = /* @__PURE__ */ new Set();
    for (const i of Object.keys(((e = this.hass) == null ? void 0 : e.states) || {})) t.add(i);
    for (const i of Object.keys(this._entityAreaById)) t.add(i);
    for (const i of this._locations)
      for (const n of i.entity_ids || [])
        t.add(n);
    return [...t];
  }
  _entityDisplayName(t) {
    var n, o, a;
    const e = (o = (n = this.hass) == null ? void 0 : n.states) == null ? void 0 : o[t], i = (a = e == null ? void 0 : e.attributes) == null ? void 0 : a.friendly_name;
    return typeof i == "string" && i.trim() ? i : t;
  }
  _effectiveAreaIdForEntity(t) {
    var i, n, o;
    if (Object.prototype.hasOwnProperty.call(this._entityAreaById, t))
      return this._entityAreaById[t];
    const e = ((o = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t]) == null ? void 0 : o.attributes) || {};
    return typeof e.area_id == "string" ? e.area_id : null;
  }
  _areaLabel(t) {
    var e, i, n;
    return t ? ((n = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t]) == null ? void 0 : n.name) || t : "Unassigned";
  }
  _isAssignableEntity(t) {
    var i, n, o;
    const e = ((o = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t]) == null ? void 0 : o.attributes) || {};
    return !((e == null ? void 0 : e.device_class) === "occupancy" && (e != null && e.location_id));
  }
  _groupTypeForLocation(t) {
    const e = C(t);
    return e === "area" ? "area" : e === "subarea" ? "subarea" : e === "floor" ? "floor" : e === "building" ? "building" : e === "grounds" ? "grounds" : "other";
  }
  _buildDeviceGroups() {
    var d;
    const t = this._entitySearch.trim().toLowerCase(), e = Object.keys(((d = this.hass) == null ? void 0 : d.states) || {}).length, i = `${t}|${e}|${this._locationsVersion}|${this._entityAreaRevision}`;
    if (this._deviceGroupsCacheKey === i)
      return this._deviceGroupsCache;
    const n = new Map(this._locations.map((u) => [u.id, u])), o = /* @__PURE__ */ new Map();
    for (const u of this._locations)
      for (const p of u.entity_ids || [])
        p && !o.has(p) && o.set(p, u.id);
    const a = /* @__PURE__ */ new Map(), r = (u, p, _, h) => {
      const f = a.get(u);
      if (f) return f;
      const m = { key: u, label: p, type: _, locationId: h, entities: [] };
      return a.set(u, m), m;
    };
    r("unassigned", "Unassigned", "unassigned");
    for (const u of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(u)) continue;
      const p = this._entityDisplayName(u), _ = o.get(u), h = _ ? n.get(_) : void 0, f = this._areaLabel(this._effectiveAreaIdForEntity(u));
      if (t && !`${p} ${u} ${(h == null ? void 0 : h.name) || ""} ${f}`.toLowerCase().includes(t))
        continue;
      if (!h) {
        r("unassigned", "Unassigned", "unassigned").entities.push(u);
        continue;
      }
      const m = this._groupTypeForLocation(h);
      r(
        h.id,
        h.name,
        m,
        h.id
      ).entities.push(u);
    }
    for (const u of a.values())
      u.entities.sort(
        (p, _) => this._entityDisplayName(p).localeCompare(this._entityDisplayName(_))
      );
    const s = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6
    }, l = [...a.values()].filter((u) => u.entities.length > 0 || u.key === "unassigned").sort((u, p) => {
      const _ = s[u.type] - s[p.type];
      return _ !== 0 ? _ : u.label.localeCompare(p.label);
    });
    return this._deviceGroupsCacheKey = i, this._deviceGroupsCache = l, l;
  }
  _applyEntityAssignmentLocally(t, e) {
    const i = this._locations.map((o) => ({
      ...o,
      entity_ids: (o.entity_ids || []).filter((a) => a !== t)
    })), n = i.find((o) => o.id === e);
    n && !n.entity_ids.includes(t) && (n.entity_ids = [...n.entity_ids, t]), this._locations = i, this._locationsVersion += 1, n && (this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [n.id]: !0
    }), n != null && n.ha_area_id && (this._entityAreaById = { ...this._entityAreaById, [t]: n.ha_area_id }, this._entityAreaRevision += 1);
  }
  async _assignEntityToLocation(t, e) {
    if (!t || !e || this._assignBusyByEntityId[t]) return;
    if (!this._locations.find((o) => o.id === e)) {
      this._showToast("Target location not found", "error");
      return;
    }
    const n = this._locations.map((o) => ({
      ...o,
      entity_ids: [...o.entity_ids || []]
    }));
    this._assignBusyByEntityId = { ...this._assignBusyByEntityId, [t]: !0 }, this._applyEntityAssignmentLocally(t, e);
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/assign_entity",
          entity_id: t,
          target_location_id: e
        })
      ), await this._loadLocations(!0);
    } catch (o) {
      this._locations = n, this._locationsVersion += 1, console.error("Failed to assign entity:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to assign device", "error");
    } finally {
      const { [t]: o, ...a } = this._assignBusyByEntityId;
      this._assignBusyByEntityId = a;
    }
  }
  async _loadLocations(t = !1) {
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      const o = await Promise.race([
        this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/list"
          })
        ),
        new Promise(
          (l, d) => setTimeout(() => d(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      if (!o || !o.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq)
        return;
      const a = /* @__PURE__ */ new Map();
      for (const l of o.locations) a.set(l.id, l);
      const s = Array.from(a.values()).filter(
        (l) => !l.is_explicit_root && !this._isManagedShadowLocation(l)
      );
      this._locations = [...s], this._adjacencyEdges = Array.isArray(o.adjacency_edges) ? [...o.adjacency_edges] : [], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._occupancyTransitionByLocation = this._buildOccupancyTransitionsFromStates(), this._locationsVersion += 1, (!this._selectedId || !this._locations.some((l) => l.id === this._selectedId) || this._isManagedShadowLocation(this._locations.find((l) => l.id === this._selectedId))) && (this._selectedId = this._preferredSelectedLocationId()), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
    } catch (n) {
      console.error("Failed to load locations:", n), this._error = n.message || "Failed to load locations";
    } finally {
      this._loading = !1;
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(t) {
    this._selectedId = t.detail.locationId;
  }
  _handleAdjacencyChanged() {
    this._loadLocations(!0);
  }
  _handleLocationMetaChanged() {
    this._loadLocations(!0);
  }
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return g`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${(n) => {
      n.preventDefault(), typeof t == "function" ? t("/config/areas") : window.location.href = "/config/areas";
    }}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: t, localName: e, haName: i } = this._renameConflict, n = this._locations.find((o) => o.id === t);
    return g`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(n == null ? void 0 : n.name) || t}" was renamed in Home Assistant to "${i}".
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
    this._renameConflict && (this._renameConflict = void 0);
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: t, haName: e } = this._renameConflict, i = this._locations.find((n) => n.id === t);
    i && (i.name = e, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._handleNewLocation();
  }
  _isTopologyAnchorLocation(t) {
    var i;
    return (((i = t == null ? void 0 : t.modules) == null ? void 0 : i._meta) || {}).topology_anchor === !0;
  }
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root || this._isTopologyAnchorLocation(t));
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : this._isTopologyAnchorLocation(t) ? "Primary property anchor cannot be deleted" : "Delete selected location" : "Select a location to delete";
  }
  _handleLocationEdit(t) {
    var n;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = e ? this._locations.find((o) => o.id === e) : this._getSelectedLocation();
    if (!i) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = i, this._newLocationDefaults = void 0, this._locationDialogOpen = !0;
  }
  async _handleLocationMoved(t) {
    t.stopPropagation();
    const { locationId: e, newParentId: i, newIndex: n } = t.detail || {};
    if (!e || typeof n != "number") {
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
            new_index: n
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (o) {
        console.error("Failed to move location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to move location", "error");
      }
    });
  }
  async _handleLocationLockToggle(t) {
    var n, o;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = !!((o = t == null ? void 0 : t.detail) != null && o.lock);
    if (!e) {
      this._showToast("Invalid lock request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var a;
      try {
        const r = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: r,
          service_data: this._serviceDataWithEntryId({
            location_id: e,
            source_id: "manual_ui"
          })
        }), await this._loadLocations(!0), this._locationsVersion += 1;
        const s = ((a = this._locations.find((l) => l.id === e)) == null ? void 0 : a.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${s}"`, "success");
      } catch (r) {
        console.error("Failed to toggle lock:", r), this._showToast((r == null ? void 0 : r.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy" || String(o == null ? void 0 : o.location_id) !== String(t)) continue;
      const a = Array.isArray(o == null ? void 0 : o.locked_by) ? o.locked_by.map((r) => String(r)) : [];
      return {
        isLocked: !!(o != null && o.is_locked),
        lockedBy: a
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var n, o;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = !!((o = t == null ? void 0 : t.detail) != null && o.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var d, u;
      const a = this._locations.find((p) => p.id === e), r = (a == null ? void 0 : a.name) || e, { isLocked: s, lockedBy: l } = this._getLocationLockState(e);
      if (s) {
        const p = l.length ? ` (${l.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${r}" is locked${p}.`, "warning");
        return;
      }
      try {
        if (!a) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const p = i ? "trigger" : "vacate_area", _ = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const h = (u = (d = a.modules) == null ? void 0 : d.occupancy) == null ? void 0 : u.default_timeout;
          typeof h == "number" && h >= 0 && (_.timeout = Math.floor(h));
        } else
          _.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: p,
          service_data: this._serviceDataWithEntryId(_)
        }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${r}" as occupied` : `Marked "${r}" as unoccupied (vacated)`,
          "success"
        );
      } catch (p) {
        console.error("Failed to toggle occupancy:", p), this._showToast((p == null ? void 0 : p.message) || "Hey, can't do it.", "error");
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
      } catch (n) {
        console.error("Failed to rename location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to rename location", "error");
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
      var n;
      try {
        const o = this._selectedId === e.id, a = e.parent_id ?? void 0;
        if (await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: e.id
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, this._pendingDeleteSelectedId = void 0, o) {
          const r = (a && this._locations.some((s) => s.id === a) ? a : (n = this._locations[0]) == null ? void 0 : n.id) ?? void 0;
          this._selectedId = r;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (o) {
        console.error("Failed to delete location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to delete location", "error");
      }
    });
  }
  async _handleLocationDialogSaved(t) {
    const e = t.detail, i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${e.name}"` : `Created "${e.name}"`,
        "success"
      );
    } catch (n) {
      console.error("Failed to reload locations:", n), this._showToast(`Failed to reload: ${n.message}`, "error");
    }
  }
  _queueResumeRefresh() {
    this._resumeRefreshQueued || !this.isConnected || !this.hass || (this._resumeRefreshQueued = !0, window.setTimeout(() => {
      this._resumeRefreshQueued = !1, !(!this.isConnected || !this.hass) && (this._subscribeToUpdates(), this._scheduleReload(!0), this._resumeRetryTimer && window.clearTimeout(this._resumeRetryTimer), this._resumeRetryTimer = window.setTimeout(() => {
        this._resumeRetryTimer = void 0, !(!this.isConnected || !this.hass) && (this._subscribeToUpdates(), this._scheduleReload(!0));
      }, 1500), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex(!0));
    }, 0));
  }
  _isSplitStackedLayout() {
    return this.narrow ? !0 : typeof window.matchMedia != "function" ? !1 : window.matchMedia("(max-width: 768px)").matches;
  }
  _clampPanelSplit(t) {
    return Number.isFinite(t) ? Math.min(Ye, Math.max(Ke, t)) : Ge;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Yi);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Yi, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _restoreRightPanelModePreference() {
    var t;
    this._rightPanelMode = "inspector";
    try {
      (t = window.localStorage) == null || t.removeItem(Xi);
    } catch {
    }
  }
  _persistRightPanelModePreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.removeItem(Xi);
    } catch {
    }
  }
  _handleRightPanelModeChange(t) {
    this._rightPanelMode !== t && (this._rightPanelMode = t, this._persistRightPanelModePreference(), t === "assign" && this._ensureEntityAreaIndex());
  }
  _applyPanelSplitFromClientX(t, e = !1) {
    var a;
    const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector(".panel-container");
    if (!i) return;
    const n = i.getBoundingClientRect();
    if (n.width <= 0) return;
    const o = (t - n.left) / n.width;
    this._setPanelSplit(o, e);
  }
  _stopPanelSplitterDrag() {
    this._isResizingPanels = !1, this._panelResizePointerId = void 0, window.removeEventListener("pointermove", this._handlePanelSplitterPointerMove), window.removeEventListener("pointerup", this._handlePanelSplitterPointerUp), window.removeEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  }
  _teardownUpdateSubscriptions() {
    this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
  }
  async _subscribeToUpdates() {
    var e;
    const t = (e = this.hass) == null ? void 0 : e.connection;
    if (!t || typeof t.subscribeEvents != "function") {
      this._teardownUpdateSubscriptions(), this._updatesSubscriptionConnection = void 0;
      return;
    }
    if (!(this._updatesSubscriptionConnection === t && this._unsubUpdates && this._unsubStateChanged && this._unsubOccupancyChanged && this._unsubHandoffTrace && this._unsubEntityRegistryUpdated && this._unsubDeviceRegistryUpdated && this._unsubAreaRegistryUpdated)) {
      this._teardownUpdateSubscriptions(), this._updatesSubscriptionConnection = t;
      try {
        this._unsubUpdates = await t.subscribeEvents(
          (i) => {
            this._scheduleReload(!0);
          },
          "topomation_updated"
        );
      } catch (i) {
        console.warn("Failed to subscribe to topomation_updated events", i);
      }
      try {
        this._unsubOccupancyChanged = await t.subscribeEvents(
          (i) => {
            var s, l, d, u;
            const n = (s = i == null ? void 0 : i.data) == null ? void 0 : s.location_id, o = (l = i == null ? void 0 : i.data) == null ? void 0 : l.occupied;
            if (!n || typeof o != "boolean") return;
            const a = (d = i == null ? void 0 : i.data) == null ? void 0 : d.previous_occupied, r = typeof ((u = i == null ? void 0 : i.data) == null ? void 0 : u.reason) == "string" && i.data.reason.trim().length ? i.data.reason.trim() : void 0;
            this._setOccupancyState(n, o, {
              previousOccupied: typeof a == "boolean" ? a : void 0,
              reason: r
            });
          },
          "topomation_occupancy_changed"
        );
      } catch (i) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", i);
      }
      try {
        this._unsubHandoffTrace = await t.subscribeEvents(
          (i) => {
            const n = (i == null ? void 0 : i.data) || {}, o = typeof n.edge_id == "string" && n.edge_id.trim() ? n.edge_id.trim() : "", a = typeof n.from_location_id == "string" && n.from_location_id.trim() ? n.from_location_id.trim() : "", r = typeof n.to_location_id == "string" && n.to_location_id.trim() ? n.to_location_id.trim() : "";
            if (!o || !a || !r) return;
            const s = {
              edge_id: o,
              from_location_id: a,
              to_location_id: r,
              trigger_entity_id: typeof n.trigger_entity_id == "string" ? n.trigger_entity_id : "",
              trigger_source_id: typeof n.trigger_source_id == "string" ? n.trigger_source_id : "",
              boundary_type: typeof n.boundary_type == "string" ? n.boundary_type : "virtual",
              handoff_window_sec: typeof n.handoff_window_sec == "number" ? n.handoff_window_sec : 12,
              status: typeof n.status == "string" ? n.status : "provisional_triggered",
              timestamp: typeof n.timestamp == "string" && n.timestamp.trim() ? n.timestamp : (/* @__PURE__ */ new Date()).toISOString()
            }, l = (u, p, _) => {
              const h = u[p] || [];
              return {
                ...u,
                [p]: [_, ...h].slice(0, 25)
              };
            };
            let d = l(this._handoffTraceByLocation, a, s);
            d = l(d, r, s), this._handoffTraceByLocation = d;
          },
          "topomation_handoff_trace"
        );
      } catch (i) {
        console.warn("Failed to subscribe to topomation_handoff_trace events", i);
      }
      try {
        this._unsubEntityRegistryUpdated = await t.subscribeEvents(
          (i) => {
            this._scheduleRegistryRefresh("entity_registry_updated", (i == null ? void 0 : i.data) || {});
          },
          "entity_registry_updated"
        );
      } catch (i) {
        console.warn("Failed to subscribe to entity_registry_updated events", i);
      }
      try {
        this._unsubDeviceRegistryUpdated = await t.subscribeEvents(
          (i) => {
            this._scheduleRegistryRefresh("device_registry_updated", (i == null ? void 0 : i.data) || {});
          },
          "device_registry_updated"
        );
      } catch (i) {
        console.warn("Failed to subscribe to device_registry_updated events", i);
      }
      try {
        this._unsubAreaRegistryUpdated = await t.subscribeEvents(
          (i) => {
            this._scheduleRegistryRefresh("area_registry_updated", (i == null ? void 0 : i.data) || {});
          },
          "area_registry_updated"
        );
      } catch (i) {
        console.warn("Failed to subscribe to area_registry_updated events", i);
      }
      await this._syncStateChangedSubscription(t);
    }
  }
  _scheduleRegistryRefresh(t, e) {
    this._registryRefreshTimer && (window.clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._registryRefreshTimer = window.setTimeout(() => {
      this._registryRefreshTimer = void 0, this._haRegistryRevision += 1, this._entityAreaIndexLoaded = !1, this._entityAreaRevision += 1, this._rightPanelMode === "assign" && this._ensureEntityAreaIndex(!0), this._scheduleReload(!0);
    }, 200);
  }
  _setOccupancyState(t, e, i) {
    const n = typeof (i == null ? void 0 : i.reason) == "string" && i.reason.trim().length ? i.reason.trim() : void 0, o = typeof (i == null ? void 0 : i.changedAt) == "string" && i.changedAt.trim().length ? i.changedAt : (/* @__PURE__ */ new Date()).toISOString();
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    }, this._occupancyTransitionByLocation = {
      ...this._occupancyTransitionByLocation,
      [t]: {
        occupied: e,
        previousOccupied: typeof (i == null ? void 0 : i.previousOccupied) == "boolean" ? i.previousOccupied : void 0,
        reason: n,
        changedAt: o
      }
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy") continue;
      const a = o.location_id;
      a && (t[a] = (n == null ? void 0 : n.state) === "on");
    }
    return t;
  }
  _buildOccupancyTransitionsFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy") continue;
      const a = o.location_id;
      if (!a) continue;
      const r = o.previous_occupied, s = typeof o.reason == "string" && o.reason.trim().length ? o.reason.trim() : void 0, l = typeof (n == null ? void 0 : n.last_changed) == "string" && n.last_changed.trim().length ? n.last_changed : void 0;
      t[a] = {
        occupied: (n == null ? void 0 : n.state) === "on",
        previousOccupied: typeof r == "boolean" ? r : void 0,
        reason: s,
        changedAt: l
      };
    }
    return t;
  }
  async _syncStateChangedSubscription(t = ((e) => (e = this.hass) == null ? void 0 : e.connection)()) {
    if (t && typeof t.subscribeEvents == "function" && !this._unsubStateChanged)
      try {
        this._unsubStateChanged = await t.subscribeEvents(
          (i) => {
            var r, s;
            const n = (r = i == null ? void 0 : i.data) == null ? void 0 : r.entity_id;
            if (!n) return;
            const o = (s = i == null ? void 0 : i.data) == null ? void 0 : s.new_state, a = (o == null ? void 0 : o.attributes) || {};
            n.startsWith("binary_sensor.") && a.device_class === "occupancy" && a.location_id && this._setOccupancyState(a.location_id, (o == null ? void 0 : o.state) === "on", {
              previousOccupied: typeof a.previous_occupied == "boolean" ? a.previous_occupied : void 0,
              reason: typeof a.reason == "string" && a.reason.trim().length ? a.reason.trim() : void 0,
              changedAt: typeof (o == null ? void 0 : o.last_changed) == "string" && o.last_changed.trim().length ? o.last_changed : void 0
            });
          },
          "state_changed"
        );
      } catch (i) {
        console.warn("Failed to subscribe to state_changed events", i);
      }
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
      t.map(([n, o]) => this._saveChange(n, o))
    ), i = e.filter((n) => n.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([n, o], a) => {
      e[a].status === "fulfilled" && this._pendingChanges.delete(n);
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
    var n, o, a, r;
    const t = (o = (n = this.panel) == null ? void 0 : n.config) == null ? void 0 : o.entry_id;
    if (typeof t == "string" && t.trim()) {
      const s = t.trim();
      return this._lastKnownEntryId = s, s;
    }
    const e = (r = (a = this.route) == null ? void 0 : a.path) == null ? void 0 : r.split("?", 2)[1];
    if (e) {
      const s = new URLSearchParams(e).get("entry_id");
      if (s && s.trim()) {
        const l = s.trim();
        return this._lastKnownEntryId = l, l;
      }
    }
    const i = new URLSearchParams(window.location.search).get("entry_id");
    if (i && i.trim()) {
      const s = i.trim();
      return this._lastKnownEntryId = s, s;
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
    this.dispatchEvent(i);
  }
  async _seedDemoData() {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
  _isManagedShadowLocation(t) {
    return t ? De(t, this._managedShadowLocationIds()) : !1;
  }
  _managedShadowLocationIds() {
    return Re(this._locations);
  }
  _parentSelectableLocations() {
    return this._locations.filter((t) => !this._isManagedShadowLocation(t));
  }
  _preferredSelectedLocationId() {
    var t;
    return (t = this._locations.find((e) => !this._isManagedShadowLocation(e))) == null ? void 0 : t.id;
  }
};
Te.properties = {
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
  _occupancyStateByLocation: { state: !0 },
  _occupancyTransitionByLocation: { state: !0 },
  _adjacencyEdges: { state: !0 },
  _handoffTraceByLocation: { state: !0 },
  _treePanelSplit: { state: !0 },
  _isResizingPanels: { state: !0 },
  _entityAreaById: { state: !0 },
  _entitySearch: { state: !0 },
  _assignBusyByEntityId: { state: !0 },
  _rightPanelMode: { state: !0 },
  _assignmentFilter: { state: !0 },
  _deviceGroupExpanded: { state: !0 },
  _haRegistryRevision: { state: !0 },
  _pendingDeleteSelectedId: { state: !0 }
}, Te.styles = [
  Qt,
  It`
      :host {
        display: block;
        height: 100%;
        min-height: 100%;
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
        :host {
          height: auto;
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .panel-container {
          flex-direction: column;
          height: auto;
        }

        .panel-left,
        .panel-right {
          flex: 0 0 auto;
          min-width: unset;
          max-width: unset;
          overflow: visible;
        }

        .panel-splitter {
          display: none;
        }

        ht-location-tree {
          flex: 0 0 auto;
          min-height: 200px;
          max-height: 52vh;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .panel-right > .header {
        padding-bottom: var(--spacing-xs);
        border-bottom: none;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .panel-right > .header .header-title {
        margin-bottom: 0;
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

      .icon-button {
        min-width: 40px;
        width: 40px;
        height: 40px;
        padding: 0;
        justify-content: center;
      }

      .icon-button ha-icon {
        --mdc-icon-size: 22px;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      ht-location-tree {
        flex: 1 1 auto;
        min-height: 0;
      }

      ht-room-explainability {
        flex: 0 0 auto;
        min-height: 0;
      }

      ht-location-inspector {
        flex: 1 1 auto;
        min-height: 0;
      }

      .device-assignment-panel {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0 var(--spacing-md) var(--spacing-md);
      }

      .device-panel-head {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--card-background-color);
        padding: var(--spacing-md) 0 var(--spacing-sm);
      }

      .device-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .device-panel-subtitle {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-search {
        width: 100%;
        margin-top: var(--spacing-sm);
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .device-toolbar {
        margin-top: var(--spacing-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-chip {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .device-group-actions {
        display: flex;
        gap: 6px;
      }

      .device-group {
        margin-top: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
      }

      .device-group-header {
        width: 100%;
        border: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.06);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        cursor: pointer;
        color: var(--primary-text-color);
        text-align: left;
      }

      .device-group-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }

      .device-group-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .device-group-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-group-chevron {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-group-count {
        color: var(--text-secondary-color);
        font-weight: 600;
        font-size: 11px;
      }

      .device-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 8px 10px;
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        background: var(--card-background-color);
      }

      .device-row[draggable="true"] {
        cursor: grab;
      }

      .device-row[draggable="true"]:active {
        cursor: grabbing;
      }

      .device-name {
        font-size: 13px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-assign-btn {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .device-empty {
        padding: 14px 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
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

    `
];
let ui = Te;
if (!customElements.get("topomation-panel"))
  try {
    customElements.define("topomation-panel", ui);
  } catch (c) {
    console.error("[topomation-panel] failed to define element", c);
  }
export {
  ui as TopomationPanel
};
