/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = globalThis, ci = se.ShadowRoot && (se.ShadyCSS === void 0 || se.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, li = Symbol(), yi = /* @__PURE__ */ new WeakMap();
let en = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== li) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ci && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = yi.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && yi.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const In = (r) => new en(typeof r == "string" ? r : r + "", void 0, li), Jt = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((i, n, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + r[o + 1], r[0]);
  return new en(e, r, li);
}, Ln = (r, t) => {
  if (ci) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), n = se.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = e.cssText, r.appendChild(i);
  }
}, vi = ci ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return In(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Cn, defineProperty: On, getOwnPropertyDescriptor: zn, getOwnPropertyNames: Mn, getOwnPropertySymbols: Pn, getPrototypeOf: Nn } = Object, ut = globalThis, bi = ut.trustedTypes, Fn = bi ? bi.emptyScript : "", Re = ut.reactiveElementPolyfillSupport, jt = (r, t) => r, Ye = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? Fn : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, t) {
  let e = r;
  switch (t) {
    case Boolean:
      e = r !== null;
      break;
    case Number:
      e = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(r);
      } catch {
        e = null;
      }
  }
  return e;
} }, nn = (r, t) => !Cn(r, t), wi = { attribute: !0, type: String, converter: Ye, reflect: !1, useDefault: !1, hasChanged: nn };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), ut.litPropertyMetadata ?? (ut.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let $t = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = wi) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, e);
      n !== void 0 && On(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: n, set: o } = zn(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: n, set(a) {
      const s = n == null ? void 0 : n.call(this);
      o == null || o.call(this, a), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? wi;
  }
  static _$Ei() {
    if (this.hasOwnProperty(jt("elementProperties"))) return;
    const t = Nn(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(jt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(jt("properties"))) {
      const e = this.properties, i = [...Mn(e), ...Pn(e)];
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
      for (const n of i) e.unshift(vi(n));
    } else t !== void 0 && e.push(vi(t));
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
    return Ln(t, this.constructor.elementStyles), t;
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
      const a = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : Ye).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var o, a;
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const s = i.getPropertyOptions(n), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((o = s.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? s.converter : Ye;
      this._$Em = n;
      const l = c.fromAttribute(e, s.type);
      this[n] = l ?? ((a = this._$Ej) == null ? void 0 : a.get(n)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var n;
    if (t !== void 0) {
      const o = this.constructor, a = this[t];
      if (i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? nn)(a, e) || i.useDefault && i.reflect && a === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
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
        const { wrapped: s } = a, c = this[o];
        s !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, a, c);
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
$t.elementStyles = [], $t.shadowRootOptions = { mode: "open" }, $t[jt("elementProperties")] = /* @__PURE__ */ new Map(), $t[jt("finalized")] = /* @__PURE__ */ new Map(), Re == null || Re({ ReactiveElement: $t }), (ut.reactiveElementVersions ?? (ut.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, pe = Ut.trustedTypes, xi = pe ? pe.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, on = "$lit$", st = `lit$${Math.random().toFixed(9).slice(2)}$`, an = "?" + st, Bn = `<${an}>`, wt = document, Gt = () => wt.createComment(""), Yt = (r) => r === null || typeof r != "object" && typeof r != "function", di = Array.isArray, jn = (r) => di(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", Ie = `[ 	
\f\r]`, Ot = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Si = /-->/g, ki = />/g, gt = RegExp(`>|${Ie}(?:([^\\s"'>=/]+)(${Ie}*=${Ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), $i = /'/g, Ai = /"/g, rn = /^(?:script|style|textarea|title)$/i, Un = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), f = Un(1), xt = Symbol.for("lit-noChange"), j = Symbol.for("lit-nothing"), Ei = /* @__PURE__ */ new WeakMap(), vt = wt.createTreeWalker(wt, 129);
function sn(r, t) {
  if (!di(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return xi !== void 0 ? xi.createHTML(t) : t;
}
const Wn = (r, t) => {
  const e = r.length - 1, i = [];
  let n, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = Ot;
  for (let s = 0; s < e; s++) {
    const c = r[s];
    let l, d, u = -1, p = 0;
    for (; p < c.length && (a.lastIndex = p, d = a.exec(c), d !== null); ) p = a.lastIndex, a === Ot ? d[1] === "!--" ? a = Si : d[1] !== void 0 ? a = ki : d[2] !== void 0 ? (rn.test(d[2]) && (n = RegExp("</" + d[2], "g")), a = gt) : d[3] !== void 0 && (a = gt) : a === gt ? d[0] === ">" ? (a = n ?? Ot, u = -1) : d[1] === void 0 ? u = -2 : (u = a.lastIndex - d[2].length, l = d[1], a = d[3] === void 0 ? gt : d[3] === '"' ? Ai : $i) : a === Ai || a === $i ? a = gt : a === Si || a === ki ? a = Ot : (a = gt, n = void 0);
    const _ = a === gt && r[s + 1].startsWith("/>") ? " " : "";
    o += a === Ot ? c + Bn : u >= 0 ? (i.push(l), c.slice(0, u) + on + c.slice(u) + st + _) : c + st + (u === -2 ? s : _);
  }
  return [sn(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Xt {
  constructor({ strings: t, _$litType$: e }, i) {
    let n;
    this.parts = [];
    let o = 0, a = 0;
    const s = t.length - 1, c = this.parts, [l, d] = Wn(t, e);
    if (this.el = Xt.createElement(l, i), vt.currentNode = this.el.content, e === 2 || e === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = vt.nextNode()) !== null && c.length < s; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(on)) {
          const p = d[a++], _ = n.getAttribute(u).split(st), h = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: o, name: h[2], strings: _, ctor: h[1] === "." ? Kn : h[1] === "?" ? qn : h[1] === "@" ? Vn : ke }), n.removeAttribute(u);
        } else u.startsWith(st) && (c.push({ type: 6, index: o }), n.removeAttribute(u));
        if (rn.test(n.tagName)) {
          const u = n.textContent.split(st), p = u.length - 1;
          if (p > 0) {
            n.textContent = pe ? pe.emptyScript : "";
            for (let _ = 0; _ < p; _++) n.append(u[_], Gt()), vt.nextNode(), c.push({ type: 2, index: ++o });
            n.append(u[p], Gt());
          }
        }
      } else if (n.nodeType === 8) if (n.data === an) c.push({ type: 2, index: o });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(st, u + 1)) !== -1; ) c.push({ type: 7, index: o }), u += st.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = wt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function Tt(r, t, e = r, i) {
  var a, s;
  if (t === xt) return t;
  let n = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const o = Yt(t) ? void 0 : t._$litDirective$;
  return (n == null ? void 0 : n.constructor) !== o && ((s = n == null ? void 0 : n._$AO) == null || s.call(n, !1), o === void 0 ? n = void 0 : (n = new o(r), n._$AT(r, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = n : e._$Cl = n), n !== void 0 && (t = Tt(r, n._$AS(r, t.values), n, i)), t;
}
let Hn = class {
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
    vt.currentNode = n;
    let o = vt.nextNode(), a = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let l;
        c.type === 2 ? l = new It(o, o.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(o, c.name, c.strings, this, t) : c.type === 6 && (l = new Gn(o, this, t)), this._$AV.push(l), c = i[++s];
      }
      a !== (c == null ? void 0 : c.index) && (o = vt.nextNode(), a++);
    }
    return vt.currentNode = wt, n;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class It {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, n) {
    this.type = 2, this._$AH = j, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = n, this._$Cv = (n == null ? void 0 : n.isConnected) ?? !0;
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
    t = Tt(this, t, e), Yt(t) ? t === j || t == null || t === "" ? (this._$AH !== j && this._$AR(), this._$AH = j) : t !== this._$AH && t !== xt && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : jn(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== j && Yt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(wt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: e, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Xt.createElement(sn(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === n) this._$AH.p(e);
    else {
      const a = new Hn(n, this), s = a.u(this.options);
      a.p(e), this.T(s), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = Ei.get(t.strings);
    return e === void 0 && Ei.set(t.strings, e = new Xt(t)), e;
  }
  k(t) {
    di(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, n = 0;
    for (const o of t) n === e.length ? e.push(i = new It(this.O(Gt()), this.O(Gt()), this, this.options)) : i = e[n], i._$AI(o), n++;
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
class ke {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, n, o) {
    this.type = 1, this._$AH = j, this._$AN = void 0, this.element = t, this.name = e, this._$AM = n, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = j;
  }
  _$AI(t, e = this, i, n) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = Tt(this, t, e, 0), a = !Yt(t) || t !== this._$AH && t !== xt, a && (this._$AH = t);
    else {
      const s = t;
      let c, l;
      for (t = o[0], c = 0; c < o.length - 1; c++) l = Tt(this, s[i + c], e, c), l === xt && (l = this._$AH[c]), a || (a = !Yt(l) || l !== this._$AH[c]), l === j ? t = j : t !== j && (t += (l ?? "") + o[c + 1]), this._$AH[c] = l;
    }
    a && !n && this.j(t);
  }
  j(t) {
    t === j ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Kn extends ke {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === j ? void 0 : t;
  }
}
class qn extends ke {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== j);
  }
}
class Vn extends ke {
  constructor(t, e, i, n, o) {
    super(t, e, i, n, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Tt(this, t, e, 0) ?? j) === xt) return;
    const i = this._$AH, n = t === j && i !== j || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== j && (i === j || n);
    n && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Gn {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Tt(this, t);
  }
}
const Yn = { I: It }, Le = Ut.litHtmlPolyfillSupport;
Le == null || Le(Xt, It), (Ut.litHtmlVersions ?? (Ut.litHtmlVersions = [])).push("3.3.1");
const Xn = (r, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const o = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = n = new It(t.insertBefore(Gt(), o), o, void 0, e ?? {});
  }
  return n._$AI(r), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bt = globalThis;
let ht = class extends $t {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Xn(e, this.renderRoot, this.renderOptions);
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
    return xt;
  }
};
var Gi;
ht._$litElement$ = !0, ht.finalized = !0, (Gi = bt.litElementHydrateSupport) == null || Gi.call(bt, { LitElement: ht });
const Ce = bt.litElementPolyfillSupport;
Ce == null || Ce({ LitElement: ht });
(bt.litElementVersions ?? (bt.litElementVersions = [])).push("4.2.1");
const $e = Jt`
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
}, cn = /* @__PURE__ */ new Set(["building", "grounds"]);
function Qn(r) {
  const t = String(r ?? "area").trim().toLowerCase(), e = Jn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function P(r) {
  var t, e;
  return Qn((e = (t = r.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function Xe(r) {
  return r === "floor" ? ["root", "building"] : cn.has(r) ? ["root"] : r === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function Zn(r, t) {
  return Xe(r).includes(t);
}
function to(r) {
  var c;
  const { locations: t, locationId: e, newParentId: i } = r;
  if (i === e || i && Je(t, e, i)) return !1;
  const n = new Map(t.map((l) => [l.id, l])), o = n.get(e);
  if (!o || i && !n.get(i) || i && ((c = n.get(i)) != null && c.is_explicit_root)) return !1;
  const a = P(o);
  if (cn.has(a))
    return i === null;
  const s = i === null ? "root" : P(n.get(i) ?? {});
  return !!Zn(a, s);
}
function Je(r, t, e) {
  if (t === e) return !1;
  const i = new Map(r.map((a) => [a.id, a]));
  let n = i.get(e);
  const o = /* @__PURE__ */ new Set();
  for (; n != null && n.parent_id; ) {
    if (n.parent_id === t || o.has(n.parent_id)) return !0;
    o.add(n.parent_id), n = i.get(n.parent_id);
  }
  return !1;
}
const eo = "managed_shadow", io = /* @__PURE__ */ new Set(["floor", "building", "grounds"]), Qt = (r) => {
  var t;
  return ((t = r == null ? void 0 : r.modules) == null ? void 0 : t._meta) || {};
}, Zt = (r, t) => {
  const e = r[t];
  return typeof e == "string" ? e.trim() : "";
}, no = (r) => Zt(Qt(r), "role").toLowerCase(), oo = (r) => Zt(Qt(r), "type").toLowerCase(), Ae = (r = []) => {
  const t = /* @__PURE__ */ new Set();
  for (const e of r) {
    const i = Qt(e), n = Zt(i, "shadow_area_id");
    n && io.has(oo(e)) && t.add(n);
  }
  return t;
}, Ee = (r, t) => {
  if (!r) return !1;
  if (t != null && t.has(r.id))
    return !0;
  const e = Qt(r);
  return !!(no(r) === eo || Zt(e, "shadow_for_location_id"));
}, ao = (r) => {
  if (!r) return "";
  const t = Qt(r);
  return Zt(t, "shadow_area_id");
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ro = { CHILD: 2 }, so = (r) => (...t) => ({ _$litDirective$: r, values: t });
class co {
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
const { I: lo } = Yn, Di = () => document.createComment(""), zt = (r, t, e) => {
  var o;
  const i = r._$AA.parentNode, n = t === void 0 ? r._$AB : t._$AA;
  if (e === void 0) {
    const a = i.insertBefore(Di(), n), s = i.insertBefore(Di(), n);
    e = new lo(a, s, r, r.options);
  } else {
    const a = e._$AB.nextSibling, s = e._$AM, c = s !== r;
    if (c) {
      let l;
      (o = e._$AQ) == null || o.call(e, r), e._$AM = r, e._$AP !== void 0 && (l = r._$AU) !== s._$AU && e._$AP(l);
    }
    if (a !== n || c) {
      let l = e._$AA;
      for (; l !== a; ) {
        const d = l.nextSibling;
        i.insertBefore(l, n), l = d;
      }
    }
  }
  return e;
}, _t = (r, t, e = r) => (r._$AI(t, e), r), uo = {}, ho = (r, t = uo) => r._$AH = t, po = (r) => r._$AH, Oe = (r) => {
  r._$AR(), r._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ti = (r, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let n = t; n <= e; n++) i.set(r[n], n);
  return i;
}, Qe = so(class extends co {
  constructor(r) {
    if (super(r), r.type !== ro.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(r, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const n = [], o = [];
    let a = 0;
    for (const s of r) n[a] = i ? i(s, a) : a, o[a] = e(s, a), a++;
    return { values: o, keys: n };
  }
  render(r, t, e) {
    return this.dt(r, t, e).values;
  }
  update(r, [t, e, i]) {
    const n = po(r), { values: o, keys: a } = this.dt(t, e, i);
    if (!Array.isArray(n)) return this.ut = a, o;
    const s = this.ut ?? (this.ut = []), c = [];
    let l, d, u = 0, p = n.length - 1, _ = 0, h = o.length - 1;
    for (; u <= p && _ <= h; ) if (n[u] === null) u++;
    else if (n[p] === null) p--;
    else if (s[u] === a[_]) c[_] = _t(n[u], o[_]), u++, _++;
    else if (s[p] === a[h]) c[h] = _t(n[p], o[h]), p--, h--;
    else if (s[u] === a[h]) c[h] = _t(n[u], o[h]), zt(r, c[h + 1], n[u]), u++, h--;
    else if (s[p] === a[_]) c[_] = _t(n[p], o[_]), zt(r, n[u], n[p]), p--, _++;
    else if (l === void 0 && (l = Ti(a, _, h), d = Ti(s, u, p)), l.has(s[u])) if (l.has(s[p])) {
      const g = d.get(a[_]), m = g !== void 0 ? n[g] : null;
      if (m === null) {
        const v = zt(r, n[u]);
        _t(v, o[_]), c[_] = v;
      } else c[_] = _t(m, o[_]), zt(r, n[u], m), n[g] = null;
      _++;
    } else Oe(n[p]), p--;
    else Oe(n[u]), u++;
    for (; _ <= h; ) {
      const g = zt(r, c[h + 1]);
      _t(g, o[_]), c[_++] = g;
    }
    for (; u <= p; ) {
      const g = n[u++];
      g !== null && Oe(g);
    }
    return this.ut = a, ho(r, c), xt;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function Ri(r, t) {
  var e = Object.keys(r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(r);
    t && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(r, n).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function et(r) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ri(Object(e), !0).forEach(function(i) {
      go(r, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(e)) : Ri(Object(e)).forEach(function(i) {
      Object.defineProperty(r, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return r;
}
function ce(r) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ce = function(t) {
    return typeof t;
  } : ce = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ce(r);
}
function go(r, t, e) {
  return t in r ? Object.defineProperty(r, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : r[t] = e, r;
}
function nt() {
  return nt = Object.assign || function(r) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
    }
    return r;
  }, nt.apply(this, arguments);
}
function _o(r, t) {
  if (r == null) return {};
  var e = {}, i = Object.keys(r), n, o;
  for (o = 0; o < i.length; o++)
    n = i[o], !(t.indexOf(n) >= 0) && (e[n] = r[n]);
  return e;
}
function fo(r, t) {
  if (r == null) return {};
  var e = _o(r, t), i, n;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(r);
    for (n = 0; n < o.length; n++)
      i = o[n], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(r, i) && (e[i] = r[i]);
  }
  return e;
}
var mo = "1.15.6";
function it(r) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(r);
}
var ot = it(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), te = it(/Edge/i), Ii = it(/firefox/i), Wt = it(/safari/i) && !it(/chrome/i) && !it(/android/i), ui = it(/iP(ad|od|hone)/i), ln = it(/chrome/i) && it(/android/i), dn = {
  capture: !1,
  passive: !1
};
function D(r, t, e) {
  r.addEventListener(t, e, !ot && dn);
}
function E(r, t, e) {
  r.removeEventListener(t, e, !ot && dn);
}
function ge(r, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), r)
      try {
        if (r.matches)
          return r.matches(t);
        if (r.msMatchesSelector)
          return r.msMatchesSelector(t);
        if (r.webkitMatchesSelector)
          return r.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function un(r) {
  return r.host && r !== document && r.host.nodeType ? r.host : r.parentNode;
}
function Q(r, t, e, i) {
  if (r) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? r.parentNode === e && ge(r, t) : ge(r, t)) || i && r === e)
        return r;
      if (r === e) break;
    } while (r = un(r));
  }
  return null;
}
var Li = /\s+/g;
function G(r, t, e) {
  if (r && t)
    if (r.classList)
      r.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + r.className + " ").replace(Li, " ").replace(" " + t + " ", " ");
      r.className = (i + (e ? " " + t : "")).replace(Li, " ");
    }
}
function w(r, t, e) {
  var i = r && r.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(r, "") : r.currentStyle && (e = r.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Dt(r, t) {
  var e = "";
  if (typeof r == "string")
    e = r;
  else
    do {
      var i = w(r, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (r = r.parentNode));
  var n = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return n && new n(e);
}
function hn(r, t, e) {
  if (r) {
    var i = r.getElementsByTagName(t), n = 0, o = i.length;
    if (e)
      for (; n < o; n++)
        e(i[n], n);
    return i;
  }
  return [];
}
function tt() {
  var r = document.scrollingElement;
  return r || document.documentElement;
}
function N(r, t, e, i, n) {
  if (!(!r.getBoundingClientRect && r !== window)) {
    var o, a, s, c, l, d, u;
    if (r !== window && r.parentNode && r !== tt() ? (o = r.getBoundingClientRect(), a = o.top, s = o.left, c = o.bottom, l = o.right, d = o.height, u = o.width) : (a = 0, s = 0, c = window.innerHeight, l = window.innerWidth, d = window.innerHeight, u = window.innerWidth), (t || e) && r !== window && (n = n || r.parentNode, !ot))
      do
        if (n && n.getBoundingClientRect && (w(n, "transform") !== "none" || e && w(n, "position") !== "static")) {
          var p = n.getBoundingClientRect();
          a -= p.top + parseInt(w(n, "border-top-width")), s -= p.left + parseInt(w(n, "border-left-width")), c = a + o.height, l = s + o.width;
          break;
        }
      while (n = n.parentNode);
    if (i && r !== window) {
      var _ = Dt(n || r), h = _ && _.a, g = _ && _.d;
      _ && (a /= g, s /= h, u /= h, d /= g, c = a + d, l = s + u);
    }
    return {
      top: a,
      left: s,
      bottom: c,
      right: l,
      width: u,
      height: d
    };
  }
}
function Ci(r, t, e) {
  for (var i = dt(r, !0), n = N(r)[t]; i; ) {
    var o = N(i)[e], a = void 0;
    if (a = n >= o, !a) return i;
    if (i === tt()) break;
    i = dt(i, !1);
  }
  return !1;
}
function Rt(r, t, e, i) {
  for (var n = 0, o = 0, a = r.children; o < a.length; ) {
    if (a[o].style.display !== "none" && a[o] !== x.ghost && (i || a[o] !== x.dragged) && Q(a[o], e.draggable, r, !1)) {
      if (n === t)
        return a[o];
      n++;
    }
    o++;
  }
  return null;
}
function hi(r, t) {
  for (var e = r.lastElementChild; e && (e === x.ghost || w(e, "display") === "none" || t && !ge(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function X(r, t) {
  var e = 0;
  if (!r || !r.parentNode)
    return -1;
  for (; r = r.previousElementSibling; )
    r.nodeName.toUpperCase() !== "TEMPLATE" && r !== x.clone && (!t || ge(r, t)) && e++;
  return e;
}
function Oi(r) {
  var t = 0, e = 0, i = tt();
  if (r)
    do {
      var n = Dt(r), o = n.a, a = n.d;
      t += r.scrollLeft * o, e += r.scrollTop * a;
    } while (r !== i && (r = r.parentNode));
  return [t, e];
}
function yo(r, t) {
  for (var e in r)
    if (r.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === r[e][i]) return Number(e);
    }
  return -1;
}
function dt(r, t) {
  if (!r || !r.getBoundingClientRect) return tt();
  var e = r, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var n = w(e);
      if (e.clientWidth < e.scrollWidth && (n.overflowX == "auto" || n.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (n.overflowY == "auto" || n.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return tt();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return tt();
}
function vo(r, t) {
  if (r && t)
    for (var e in t)
      t.hasOwnProperty(e) && (r[e] = t[e]);
  return r;
}
function ze(r, t) {
  return Math.round(r.top) === Math.round(t.top) && Math.round(r.left) === Math.round(t.left) && Math.round(r.height) === Math.round(t.height) && Math.round(r.width) === Math.round(t.width);
}
var Ht;
function pn(r, t) {
  return function() {
    if (!Ht) {
      var e = arguments, i = this;
      e.length === 1 ? r.call(i, e[0]) : r.apply(i, e), Ht = setTimeout(function() {
        Ht = void 0;
      }, t);
    }
  };
}
function bo() {
  clearTimeout(Ht), Ht = void 0;
}
function gn(r, t, e) {
  r.scrollLeft += t, r.scrollTop += e;
}
function _n(r) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(r).cloneNode(!0) : e ? e(r).clone(!0)[0] : r.cloneNode(!0);
}
function fn(r, t, e) {
  var i = {};
  return Array.from(r.children).forEach(function(n) {
    var o, a, s, c;
    if (!(!Q(n, t.draggable, r, !1) || n.animated || n === e)) {
      var l = N(n);
      i.left = Math.min((o = i.left) !== null && o !== void 0 ? o : 1 / 0, l.left), i.top = Math.min((a = i.top) !== null && a !== void 0 ? a : 1 / 0, l.top), i.right = Math.max((s = i.right) !== null && s !== void 0 ? s : -1 / 0, l.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, l.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var q = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function wo() {
  var r = [], t;
  return {
    captureAnimationState: function() {
      if (r = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(n) {
          if (!(w(n, "display") === "none" || n === x.ghost)) {
            r.push({
              target: n,
              rect: N(n)
            });
            var o = et({}, r[r.length - 1].rect);
            if (n.thisAnimationDuration) {
              var a = Dt(n, !0);
              a && (o.top -= a.f, o.left -= a.e);
            }
            n.fromRect = o;
          }
        });
      }
    },
    addAnimationState: function(i) {
      r.push(i);
    },
    removeAnimationState: function(i) {
      r.splice(yo(r, {
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
      r.forEach(function(s) {
        var c = 0, l = s.target, d = l.fromRect, u = N(l), p = l.prevFromRect, _ = l.prevToRect, h = s.rect, g = Dt(l, !0);
        g && (u.top -= g.f, u.left -= g.e), l.toRect = u, l.thisAnimationDuration && ze(p, u) && !ze(d, u) && // Make sure animatingRect is on line between toRect & fromRect
        (h.top - u.top) / (h.left - u.left) === (d.top - u.top) / (d.left - u.left) && (c = So(h, p, _, n.options)), ze(u, d) || (l.prevFromRect = d, l.prevToRect = u, c || (c = n.options.animation), n.animate(l, h, u, c)), c && (o = !0, a = Math.max(a, c), clearTimeout(l.animationResetTimer), l.animationResetTimer = setTimeout(function() {
          l.animationTime = 0, l.prevFromRect = null, l.fromRect = null, l.prevToRect = null, l.thisAnimationDuration = null;
        }, c), l.thisAnimationDuration = c);
      }), clearTimeout(t), o ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, a) : typeof i == "function" && i(), r = [];
    },
    animate: function(i, n, o, a) {
      if (a) {
        w(i, "transition", ""), w(i, "transform", "");
        var s = Dt(this.el), c = s && s.a, l = s && s.d, d = (n.left - o.left) / (c || 1), u = (n.top - o.top) / (l || 1);
        i.animatingX = !!d, i.animatingY = !!u, w(i, "transform", "translate3d(" + d + "px," + u + "px,0)"), this.forRepaintDummy = xo(i), w(i, "transition", "transform " + a + "ms" + (this.options.easing ? " " + this.options.easing : "")), w(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          w(i, "transition", ""), w(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, a);
      }
    }
  };
}
function xo(r) {
  return r.offsetWidth;
}
function So(r, t, e, i) {
  return Math.sqrt(Math.pow(t.top - r.top, 2) + Math.pow(t.left - r.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var St = [], Me = {
  initializeByDefault: !0
}, ee = {
  mount: function(t) {
    for (var e in Me)
      Me.hasOwnProperty(e) && !(e in t) && (t[e] = Me[e]);
    St.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), St.push(t);
  },
  pluginEvent: function(t, e, i) {
    var n = this;
    this.eventCanceled = !1, i.cancel = function() {
      n.eventCanceled = !0;
    };
    var o = t + "Global";
    St.forEach(function(a) {
      e[a.pluginName] && (e[a.pluginName][o] && e[a.pluginName][o](et({
        sortable: e
      }, i)), e.options[a.pluginName] && e[a.pluginName][t] && e[a.pluginName][t](et({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, n) {
    St.forEach(function(s) {
      var c = s.pluginName;
      if (!(!t.options[c] && !s.initializeByDefault)) {
        var l = new s(t, e, t.options);
        l.sortable = t, l.options = t.options, t[c] = l, nt(i, l.defaults);
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
    return St.forEach(function(n) {
      typeof n.eventProperties == "function" && nt(i, n.eventProperties.call(e[n.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var n;
    return St.forEach(function(o) {
      t[o.pluginName] && o.optionListeners && typeof o.optionListeners[e] == "function" && (n = o.optionListeners[e].call(t[o.pluginName], i));
    }), n;
  }
};
function ko(r) {
  var t = r.sortable, e = r.rootEl, i = r.name, n = r.targetEl, o = r.cloneEl, a = r.toEl, s = r.fromEl, c = r.oldIndex, l = r.newIndex, d = r.oldDraggableIndex, u = r.newDraggableIndex, p = r.originalEvent, _ = r.putSortable, h = r.extraEventProperties;
  if (t = t || e && e[q], !!t) {
    var g, m = t.options, v = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !ot && !te ? g = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (g = document.createEvent("Event"), g.initEvent(i, !0, !0)), g.to = a || e, g.from = s || e, g.item = n || e, g.clone = o, g.oldIndex = c, g.newIndex = l, g.oldDraggableIndex = d, g.newDraggableIndex = u, g.originalEvent = p, g.pullMode = _ ? _.lastPutMode : void 0;
    var k = et(et({}, h), ee.getEventProperties(i, t));
    for (var $ in k)
      g[$] = k[$];
    e && e.dispatchEvent(g), m[v] && m[v].call(t, g);
  }
}
var $o = ["evt"], K = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, n = i.evt, o = fo(i, $o);
  ee.pluginEvent.bind(x)(t, e, et({
    dragEl: y,
    parentEl: z,
    ghostEl: S,
    rootEl: L,
    nextEl: yt,
    lastDownEl: le,
    cloneEl: C,
    cloneHidden: ct,
    dragStarted: Pt,
    putSortable: U,
    activeSortable: x.active,
    originalEvent: n,
    oldIndex: Et,
    oldDraggableIndex: Kt,
    newIndex: Y,
    newDraggableIndex: rt,
    hideGhostForTarget: bn,
    unhideGhostForTarget: wn,
    cloneNowHidden: function() {
      ct = !0;
    },
    cloneNowShown: function() {
      ct = !1;
    },
    dispatchSortableEvent: function(s) {
      H({
        sortable: e,
        name: s,
        originalEvent: n
      });
    }
  }, o));
};
function H(r) {
  ko(et({
    putSortable: U,
    cloneEl: C,
    targetEl: y,
    rootEl: L,
    oldIndex: Et,
    oldDraggableIndex: Kt,
    newIndex: Y,
    newDraggableIndex: rt
  }, r));
}
var y, z, S, L, yt, le, C, ct, Et, Y, Kt, rt, ne, U, At = !1, _e = !1, fe = [], ft, J, Pe, Ne, zi, Mi, Pt, kt, qt, Vt = !1, oe = !1, de, W, Fe = [], Ze = !1, me = [], De = typeof document < "u", ae = ui, Pi = te || ot ? "cssFloat" : "float", Ao = De && !ln && !ui && "draggable" in document.createElement("div"), mn = function() {
  if (De) {
    if (ot)
      return !1;
    var r = document.createElement("x");
    return r.style.cssText = "pointer-events:auto", r.style.pointerEvents === "auto";
  }
}(), yn = function(t, e) {
  var i = w(t), n = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), o = Rt(t, 0, e), a = Rt(t, 1, e), s = o && w(o), c = a && w(a), l = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + N(o).width, d = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + N(a).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (o && s.float && s.float !== "none") {
    var u = s.float === "left" ? "left" : "right";
    return a && (c.clear === "both" || c.clear === u) ? "vertical" : "horizontal";
  }
  return o && (s.display === "block" || s.display === "flex" || s.display === "table" || s.display === "grid" || l >= n && i[Pi] === "none" || a && i[Pi] === "none" && l + d > n) ? "vertical" : "horizontal";
}, Eo = function(t, e, i) {
  var n = i ? t.left : t.top, o = i ? t.right : t.bottom, a = i ? t.width : t.height, s = i ? e.left : e.top, c = i ? e.right : e.bottom, l = i ? e.width : e.height;
  return n === s || o === c || n + a / 2 === s + l / 2;
}, Do = function(t, e) {
  var i;
  return fe.some(function(n) {
    var o = n[q].options.emptyInsertThreshold;
    if (!(!o || hi(n))) {
      var a = N(n), s = t >= a.left - o && t <= a.right + o, c = e >= a.top - o && e <= a.bottom + o;
      if (s && c)
        return i = n;
    }
  }), i;
}, vn = function(t) {
  function e(o, a) {
    return function(s, c, l, d) {
      var u = s.options.group.name && c.options.group.name && s.options.group.name === c.options.group.name;
      if (o == null && (a || u))
        return !0;
      if (o == null || o === !1)
        return !1;
      if (a && o === "clone")
        return o;
      if (typeof o == "function")
        return e(o(s, c, l, d), a)(s, c, l, d);
      var p = (a ? s : c).options.group.name;
      return o === !0 || typeof o == "string" && o === p || o.join && o.indexOf(p) > -1;
    };
  }
  var i = {}, n = t.group;
  (!n || ce(n) != "object") && (n = {
    name: n
  }), i.name = n.name, i.checkPull = e(n.pull, !0), i.checkPut = e(n.put), i.revertClone = n.revertClone, t.group = i;
}, bn = function() {
  !mn && S && w(S, "display", "none");
}, wn = function() {
  !mn && S && w(S, "display", "");
};
De && !ln && document.addEventListener("click", function(r) {
  if (_e)
    return r.preventDefault(), r.stopPropagation && r.stopPropagation(), r.stopImmediatePropagation && r.stopImmediatePropagation(), _e = !1, !1;
}, !0);
var mt = function(t) {
  if (y) {
    t = t.touches ? t.touches[0] : t;
    var e = Do(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var n in t)
        t.hasOwnProperty(n) && (i[n] = t[n]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[q]._onDragOver(i);
    }
  }
}, To = function(t) {
  y && y.parentNode[q]._isOutsideThisEl(t.target);
};
function x(r, t) {
  if (!(r && r.nodeType && r.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(r));
  this.el = r, this.options = t = nt({}, t), r[q] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(r.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return yn(r, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(a, s) {
      a.setData("Text", s.textContent);
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
    supportPointer: x.supportPointer !== !1 && "PointerEvent" in window && (!Wt || ui),
    emptyInsertThreshold: 5
  };
  ee.initializePlugins(this, r, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  vn(t);
  for (var n in this)
    n.charAt(0) === "_" && typeof this[n] == "function" && (this[n] = this[n].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : Ao, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? D(r, "pointerdown", this._onTapStart) : (D(r, "mousedown", this._onTapStart), D(r, "touchstart", this._onTapStart)), this.nativeDraggable && (D(r, "dragover", this), D(r, "dragenter", this)), fe.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), nt(this, wo());
}
x.prototype = /** @lends Sortable.prototype */
{
  constructor: x,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (kt = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, y) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, n = this.options, o = n.preventOnFilter, a = t.type, s = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (s || t).target, l = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, d = n.filter;
      if (Po(i), !y && !(/mousedown|pointerdown/.test(a) && t.button !== 0 || n.disabled) && !l.isContentEditable && !(!this.nativeDraggable && Wt && c && c.tagName.toUpperCase() === "SELECT") && (c = Q(c, n.draggable, i, !1), !(c && c.animated) && le !== c)) {
        if (Et = X(c), Kt = X(c, n.draggable), typeof d == "function") {
          if (d.call(this, t, c, this)) {
            H({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), K("filter", e, {
              evt: t
            }), o && t.preventDefault();
            return;
          }
        } else if (d && (d = d.split(",").some(function(u) {
          if (u = Q(l, u.trim(), i, !1), u)
            return H({
              sortable: e,
              rootEl: u,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), K("filter", e, {
              evt: t
            }), !0;
        }), d)) {
          o && t.preventDefault();
          return;
        }
        n.handle && !Q(l, n.handle, i, !1) || this._prepareDragStart(t, s, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var n = this, o = n.el, a = n.options, s = o.ownerDocument, c;
    if (i && !y && i.parentNode === o) {
      var l = N(i);
      if (L = o, y = i, z = y.parentNode, yt = y.nextSibling, le = i, ne = a.group, x.dragged = y, ft = {
        target: y,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, zi = ft.clientX - l.left, Mi = ft.clientY - l.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, y.style["will-change"] = "all", c = function() {
        if (K("delayEnded", n, {
          evt: t
        }), x.eventCanceled) {
          n._onDrop();
          return;
        }
        n._disableDelayedDragEvents(), !Ii && n.nativeDraggable && (y.draggable = !0), n._triggerDragStart(t, e), H({
          sortable: n,
          name: "choose",
          originalEvent: t
        }), G(y, a.chosenClass, !0);
      }, a.ignore.split(",").forEach(function(d) {
        hn(y, d.trim(), Be);
      }), D(s, "dragover", mt), D(s, "mousemove", mt), D(s, "touchmove", mt), a.supportPointer ? (D(s, "pointerup", n._onDrop), !this.nativeDraggable && D(s, "pointercancel", n._onDrop)) : (D(s, "mouseup", n._onDrop), D(s, "touchend", n._onDrop), D(s, "touchcancel", n._onDrop)), Ii && this.nativeDraggable && (this.options.touchStartThreshold = 4, y.draggable = !0), K("delayStart", this, {
        evt: t
      }), a.delay && (!a.delayOnTouchOnly || e) && (!this.nativeDraggable || !(te || ot))) {
        if (x.eventCanceled) {
          this._onDrop();
          return;
        }
        a.supportPointer ? (D(s, "pointerup", n._disableDelayedDrag), D(s, "pointercancel", n._disableDelayedDrag)) : (D(s, "mouseup", n._disableDelayedDrag), D(s, "touchend", n._disableDelayedDrag), D(s, "touchcancel", n._disableDelayedDrag)), D(s, "mousemove", n._delayedDragTouchMoveHandler), D(s, "touchmove", n._delayedDragTouchMoveHandler), a.supportPointer && D(s, "pointermove", n._delayedDragTouchMoveHandler), n._dragStartTimer = setTimeout(c, a.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    y && Be(y), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    E(t, "mouseup", this._disableDelayedDrag), E(t, "touchend", this._disableDelayedDrag), E(t, "touchcancel", this._disableDelayedDrag), E(t, "pointerup", this._disableDelayedDrag), E(t, "pointercancel", this._disableDelayedDrag), E(t, "mousemove", this._delayedDragTouchMoveHandler), E(t, "touchmove", this._delayedDragTouchMoveHandler), E(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? D(document, "pointermove", this._onTouchMove) : e ? D(document, "touchmove", this._onTouchMove) : D(document, "mousemove", this._onTouchMove) : (D(y, "dragend", this), D(L, "dragstart", this._onDragStart));
    try {
      document.selection ? ue(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (At = !1, L && y) {
      K("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && D(document, "dragover", To);
      var i = this.options;
      !t && G(y, i.dragClass, !1), G(y, i.ghostClass, !0), x.active = this, t && this._appendGhost(), H({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (J) {
      this._lastX = J.clientX, this._lastY = J.clientY, bn();
      for (var t = document.elementFromPoint(J.clientX, J.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(J.clientX, J.clientY), t !== e); )
        e = t;
      if (y.parentNode[q]._isOutsideThisEl(t), e)
        do {
          if (e[q]) {
            var i = void 0;
            if (i = e[q]._onDragOver({
              clientX: J.clientX,
              clientY: J.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = un(e));
      wn();
    }
  },
  _onTouchMove: function(t) {
    if (ft) {
      var e = this.options, i = e.fallbackTolerance, n = e.fallbackOffset, o = t.touches ? t.touches[0] : t, a = S && Dt(S, !0), s = S && a && a.a, c = S && a && a.d, l = ae && W && Oi(W), d = (o.clientX - ft.clientX + n.x) / (s || 1) + (l ? l[0] - Fe[0] : 0) / (s || 1), u = (o.clientY - ft.clientY + n.y) / (c || 1) + (l ? l[1] - Fe[1] : 0) / (c || 1);
      if (!x.active && !At) {
        if (i && Math.max(Math.abs(o.clientX - this._lastX), Math.abs(o.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (S) {
        a ? (a.e += d - (Pe || 0), a.f += u - (Ne || 0)) : a = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: d,
          f: u
        };
        var p = "matrix(".concat(a.a, ",").concat(a.b, ",").concat(a.c, ",").concat(a.d, ",").concat(a.e, ",").concat(a.f, ")");
        w(S, "webkitTransform", p), w(S, "mozTransform", p), w(S, "msTransform", p), w(S, "transform", p), Pe = d, Ne = u, J = o;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!S) {
      var t = this.options.fallbackOnBody ? document.body : L, e = N(y, !0, ae, !0, t), i = this.options;
      if (ae) {
        for (W = t; w(W, "position") === "static" && w(W, "transform") === "none" && W !== document; )
          W = W.parentNode;
        W !== document.body && W !== document.documentElement ? (W === document && (W = tt()), e.top += W.scrollTop, e.left += W.scrollLeft) : W = tt(), Fe = Oi(W);
      }
      S = y.cloneNode(!0), G(S, i.ghostClass, !1), G(S, i.fallbackClass, !0), G(S, i.dragClass, !0), w(S, "transition", ""), w(S, "transform", ""), w(S, "box-sizing", "border-box"), w(S, "margin", 0), w(S, "top", e.top), w(S, "left", e.left), w(S, "width", e.width), w(S, "height", e.height), w(S, "opacity", "0.8"), w(S, "position", ae ? "absolute" : "fixed"), w(S, "zIndex", "100000"), w(S, "pointerEvents", "none"), x.ghost = S, t.appendChild(S), w(S, "transform-origin", zi / parseInt(S.style.width) * 100 + "% " + Mi / parseInt(S.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, n = t.dataTransfer, o = i.options;
    if (K("dragStart", this, {
      evt: t
    }), x.eventCanceled) {
      this._onDrop();
      return;
    }
    K("setupClone", this), x.eventCanceled || (C = _n(y), C.removeAttribute("id"), C.draggable = !1, C.style["will-change"] = "", this._hideClone(), G(C, this.options.chosenClass, !1), x.clone = C), i.cloneId = ue(function() {
      K("clone", i), !x.eventCanceled && (i.options.removeCloneOnHide || L.insertBefore(C, y), i._hideClone(), H({
        sortable: i,
        name: "clone"
      }));
    }), !e && G(y, o.dragClass, !0), e ? (_e = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (E(document, "mouseup", i._onDrop), E(document, "touchend", i._onDrop), E(document, "touchcancel", i._onDrop), n && (n.effectAllowed = "move", o.setData && o.setData.call(i, n, y)), D(document, "drop", i), w(y, "transform", "translateZ(0)")), At = !0, i._dragStartId = ue(i._dragStarted.bind(i, e, t)), D(document, "selectstart", i), Pt = !0, window.getSelection().removeAllRanges(), Wt && w(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, n, o, a, s = this.options, c = s.group, l = x.active, d = ne === c, u = s.sort, p = U || l, _, h = this, g = !1;
    if (Ze) return;
    function m(Ct, Tn) {
      K(Ct, h, et({
        evt: t,
        isOwner: d,
        axis: _ ? "vertical" : "horizontal",
        revert: a,
        dragRect: n,
        targetRect: o,
        canSort: u,
        fromSortable: p,
        target: i,
        completed: k,
        onMove: function(mi, Rn) {
          return re(L, e, y, n, mi, N(mi), t, Rn);
        },
        changed: $
      }, Tn));
    }
    function v() {
      m("dragOverAnimationCapture"), h.captureAnimationState(), h !== p && p.captureAnimationState();
    }
    function k(Ct) {
      return m("dragOverCompleted", {
        insertion: Ct
      }), Ct && (d ? l._hideClone() : l._showClone(h), h !== p && (G(y, U ? U.options.ghostClass : l.options.ghostClass, !1), G(y, s.ghostClass, !0)), U !== h && h !== x.active ? U = h : h === x.active && U && (U = null), p === h && (h._ignoreWhileAnimating = i), h.animateAll(function() {
        m("dragOverAnimationComplete"), h._ignoreWhileAnimating = null;
      }), h !== p && (p.animateAll(), p._ignoreWhileAnimating = null)), (i === y && !y.animated || i === e && !i.animated) && (kt = null), !s.dragoverBubble && !t.rootEl && i !== document && (y.parentNode[q]._isOutsideThisEl(t.target), !Ct && mt(t)), !s.dragoverBubble && t.stopPropagation && t.stopPropagation(), g = !0;
    }
    function $() {
      Y = X(y), rt = X(y, s.draggable), H({
        sortable: h,
        name: "change",
        toEl: e,
        newIndex: Y,
        newDraggableIndex: rt,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = Q(i, s.draggable, e, !0), m("dragOver"), x.eventCanceled) return g;
    if (y.contains(t.target) || i.animated && i.animatingX && i.animatingY || h._ignoreWhileAnimating === i)
      return k(!1);
    if (_e = !1, l && !s.disabled && (d ? u || (a = z !== L) : U === this || (this.lastPutMode = ne.checkPull(this, l, y, t)) && c.checkPut(this, l, y, t))) {
      if (_ = this._getDirection(t, i) === "vertical", n = N(y), m("dragOverValid"), x.eventCanceled) return g;
      if (a)
        return z = L, v(), this._hideClone(), m("revert"), x.eventCanceled || (yt ? L.insertBefore(y, yt) : L.appendChild(y)), k(!0);
      var b = hi(e, s.draggable);
      if (!b || Co(t, _, this) && !b.animated) {
        if (b === y)
          return k(!1);
        if (b && e === t.target && (i = b), i && (o = N(i)), re(L, e, y, n, i, o, t, !!i) !== !1)
          return v(), b && b.nextSibling ? e.insertBefore(y, b.nextSibling) : e.appendChild(y), z = e, $(), k(!0);
      } else if (b && Lo(t, _, this)) {
        var R = Rt(e, 0, s, !0);
        if (R === y)
          return k(!1);
        if (i = R, o = N(i), re(L, e, y, n, i, o, t, !1) !== !1)
          return v(), e.insertBefore(y, R), z = e, $(), k(!0);
      } else if (i.parentNode === e) {
        o = N(i);
        var T = 0, I, F = y.parentNode !== e, O = !Eo(y.animated && y.toRect || n, i.animated && i.toRect || o, _), A = _ ? "top" : "left", B = Ci(i, "top", "top") || Ci(y, "top", "top"), Z = B ? B.scrollTop : void 0;
        kt !== i && (I = o[A], Vt = !1, oe = !O && s.invertSwap || F), T = Oo(t, i, o, _, O ? 1 : s.swapThreshold, s.invertedSwapThreshold == null ? s.swapThreshold : s.invertedSwapThreshold, oe, kt === i);
        var V;
        if (T !== 0) {
          var pt = X(y);
          do
            pt -= T, V = z.children[pt];
          while (V && (w(V, "display") === "none" || V === S));
        }
        if (T === 0 || V === i)
          return k(!1);
        kt = i, qt = T;
        var Lt = i.nextElementSibling, at = !1;
        at = T === 1;
        var ie = re(L, e, y, n, i, o, t, at);
        if (ie !== !1)
          return (ie === 1 || ie === -1) && (at = ie === 1), Ze = !0, setTimeout(Io, 30), v(), at && !Lt ? e.appendChild(y) : i.parentNode.insertBefore(y, at ? Lt : i), B && gn(B, 0, Z - B.scrollTop), z = y.parentNode, I !== void 0 && !oe && (de = Math.abs(I - N(i)[A])), $(), k(!0);
      }
      if (e.contains(y))
        return k(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    E(document, "mousemove", this._onTouchMove), E(document, "touchmove", this._onTouchMove), E(document, "pointermove", this._onTouchMove), E(document, "dragover", mt), E(document, "mousemove", mt), E(document, "touchmove", mt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    E(t, "mouseup", this._onDrop), E(t, "touchend", this._onDrop), E(t, "pointerup", this._onDrop), E(t, "pointercancel", this._onDrop), E(t, "touchcancel", this._onDrop), E(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (Y = X(y), rt = X(y, i.draggable), K("drop", this, {
      evt: t
    }), z = y && y.parentNode, Y = X(y), rt = X(y, i.draggable), x.eventCanceled) {
      this._nulling();
      return;
    }
    At = !1, oe = !1, Vt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), ti(this.cloneId), ti(this._dragStartId), this.nativeDraggable && (E(document, "drop", this), E(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Wt && w(document.body, "user-select", ""), w(y, "transform", ""), t && (Pt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), S && S.parentNode && S.parentNode.removeChild(S), (L === z || U && U.lastPutMode !== "clone") && C && C.parentNode && C.parentNode.removeChild(C), y && (this.nativeDraggable && E(y, "dragend", this), Be(y), y.style["will-change"] = "", Pt && !At && G(y, U ? U.options.ghostClass : this.options.ghostClass, !1), G(y, this.options.chosenClass, !1), H({
      sortable: this,
      name: "unchoose",
      toEl: z,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), L !== z ? (Y >= 0 && (H({
      rootEl: z,
      name: "add",
      toEl: z,
      fromEl: L,
      originalEvent: t
    }), H({
      sortable: this,
      name: "remove",
      toEl: z,
      originalEvent: t
    }), H({
      rootEl: z,
      name: "sort",
      toEl: z,
      fromEl: L,
      originalEvent: t
    }), H({
      sortable: this,
      name: "sort",
      toEl: z,
      originalEvent: t
    })), U && U.save()) : Y !== Et && Y >= 0 && (H({
      sortable: this,
      name: "update",
      toEl: z,
      originalEvent: t
    }), H({
      sortable: this,
      name: "sort",
      toEl: z,
      originalEvent: t
    })), x.active && ((Y == null || Y === -1) && (Y = Et, rt = Kt), H({
      sortable: this,
      name: "end",
      toEl: z,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    K("nulling", this), L = y = z = S = yt = C = le = ct = ft = J = Pt = Y = rt = Et = Kt = kt = qt = U = ne = x.dragged = x.ghost = x.clone = x.active = null, me.forEach(function(t) {
      t.checked = !0;
    }), me.length = Pe = Ne = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        y && (this._onDragOver(t), Ro(t));
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
      e = i[n], Q(e, a.draggable, this.el, !1) && t.push(e.getAttribute(a.dataIdAttr) || Mo(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, n = this.el;
    this.toArray().forEach(function(o, a) {
      var s = n.children[a];
      Q(s, this.options.draggable, n, !1) && (i[o] = s);
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
    return Q(t, e || this.options.draggable, this.el, !1);
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
    typeof n < "u" ? i[t] = n : i[t] = e, t === "group" && vn(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    K("destroy", this);
    var t = this.el;
    t[q] = null, E(t, "mousedown", this._onTapStart), E(t, "touchstart", this._onTapStart), E(t, "pointerdown", this._onTapStart), this.nativeDraggable && (E(t, "dragover", this), E(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), fe.splice(fe.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!ct) {
      if (K("hideClone", this), x.eventCanceled) return;
      w(C, "display", "none"), this.options.removeCloneOnHide && C.parentNode && C.parentNode.removeChild(C), ct = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (ct) {
      if (K("showClone", this), x.eventCanceled) return;
      y.parentNode == L && !this.options.group.revertClone ? L.insertBefore(C, y) : yt ? L.insertBefore(C, yt) : L.appendChild(C), this.options.group.revertClone && this.animate(y, C), w(C, "display", ""), ct = !1;
    }
  }
};
function Ro(r) {
  r.dataTransfer && (r.dataTransfer.dropEffect = "move"), r.cancelable && r.preventDefault();
}
function re(r, t, e, i, n, o, a, s) {
  var c, l = r[q], d = l.options.onMove, u;
  return window.CustomEvent && !ot && !te ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = r, c.dragged = e, c.draggedRect = i, c.related = n || t, c.relatedRect = o || N(t), c.willInsertAfter = s, c.originalEvent = a, r.dispatchEvent(c), d && (u = d.call(l, c, a)), u;
}
function Be(r) {
  r.draggable = !1;
}
function Io() {
  Ze = !1;
}
function Lo(r, t, e) {
  var i = N(Rt(e.el, 0, e.options, !0)), n = fn(e.el, e.options, S), o = 10;
  return t ? r.clientX < n.left - o || r.clientY < i.top && r.clientX < i.right : r.clientY < n.top - o || r.clientY < i.bottom && r.clientX < i.left;
}
function Co(r, t, e) {
  var i = N(hi(e.el, e.options.draggable)), n = fn(e.el, e.options, S), o = 10;
  return t ? r.clientX > n.right + o || r.clientY > i.bottom && r.clientX > i.left : r.clientY > n.bottom + o || r.clientX > i.right && r.clientY > i.top;
}
function Oo(r, t, e, i, n, o, a, s) {
  var c = i ? r.clientY : r.clientX, l = i ? e.height : e.width, d = i ? e.top : e.left, u = i ? e.bottom : e.right, p = !1;
  if (!a) {
    if (s && de < l * n) {
      if (!Vt && (qt === 1 ? c > d + l * o / 2 : c < u - l * o / 2) && (Vt = !0), Vt)
        p = !0;
      else if (qt === 1 ? c < d + de : c > u - de)
        return -qt;
    } else if (c > d + l * (1 - n) / 2 && c < u - l * (1 - n) / 2)
      return zo(t);
  }
  return p = p || a, p && (c < d + l * o / 2 || c > u - l * o / 2) ? c > d + l / 2 ? 1 : -1 : 0;
}
function zo(r) {
  return X(y) < X(r) ? 1 : -1;
}
function Mo(r) {
  for (var t = r.tagName + r.className + r.src + r.href + r.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function Po(r) {
  me.length = 0;
  for (var t = r.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && me.push(i);
  }
}
function ue(r) {
  return setTimeout(r, 0);
}
function ti(r) {
  return clearTimeout(r);
}
De && D(document, "touchmove", function(r) {
  (x.active || At) && r.cancelable && r.preventDefault();
});
x.utils = {
  on: D,
  off: E,
  css: w,
  find: hn,
  is: function(t, e) {
    return !!Q(t, e, t, !1);
  },
  extend: vo,
  throttle: pn,
  closest: Q,
  toggleClass: G,
  clone: _n,
  index: X,
  nextTick: ue,
  cancelNextTick: ti,
  detectDirection: yn,
  getChild: Rt,
  expando: q
};
x.get = function(r) {
  return r[q];
};
x.mount = function() {
  for (var r = arguments.length, t = new Array(r), e = 0; e < r; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (x.utils = et(et({}, x.utils), i.utils)), ee.mount(i);
  });
};
x.create = function(r, t) {
  return new x(r, t);
};
x.version = mo;
var M = [], Nt, ei, ii = !1, je, Ue, ye, Ft;
function No() {
  function r() {
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
  return r.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? D(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? D(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? D(document, "touchmove", this._handleFallbackAutoScroll) : D(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? E(document, "dragover", this._handleAutoScroll) : (E(document, "pointermove", this._handleFallbackAutoScroll), E(document, "touchmove", this._handleFallbackAutoScroll), E(document, "mousemove", this._handleFallbackAutoScroll)), Ni(), he(), bo();
    },
    nulling: function() {
      ye = ei = Nt = ii = Ft = je = Ue = null, M.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var n = this, o = (e.touches ? e.touches[0] : e).clientX, a = (e.touches ? e.touches[0] : e).clientY, s = document.elementFromPoint(o, a);
      if (ye = e, i || this.options.forceAutoScrollFallback || te || ot || Wt) {
        We(e, this.options, s, i);
        var c = dt(s, !0);
        ii && (!Ft || o !== je || a !== Ue) && (Ft && Ni(), Ft = setInterval(function() {
          var l = dt(document.elementFromPoint(o, a), !0);
          l !== c && (c = l, he()), We(e, n.options, l, i);
        }, 10), je = o, Ue = a);
      } else {
        if (!this.options.bubbleScroll || dt(s, !0) === tt()) {
          he();
          return;
        }
        We(e, this.options, dt(s, !1), !1);
      }
    }
  }, nt(r, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function he() {
  M.forEach(function(r) {
    clearInterval(r.pid);
  }), M = [];
}
function Ni() {
  clearInterval(Ft);
}
var We = pn(function(r, t, e, i) {
  if (t.scroll) {
    var n = (r.touches ? r.touches[0] : r).clientX, o = (r.touches ? r.touches[0] : r).clientY, a = t.scrollSensitivity, s = t.scrollSpeed, c = tt(), l = !1, d;
    ei !== e && (ei = e, he(), Nt = t.scroll, d = t.scrollFn, Nt === !0 && (Nt = dt(e, !0)));
    var u = 0, p = Nt;
    do {
      var _ = p, h = N(_), g = h.top, m = h.bottom, v = h.left, k = h.right, $ = h.width, b = h.height, R = void 0, T = void 0, I = _.scrollWidth, F = _.scrollHeight, O = w(_), A = _.scrollLeft, B = _.scrollTop;
      _ === c ? (R = $ < I && (O.overflowX === "auto" || O.overflowX === "scroll" || O.overflowX === "visible"), T = b < F && (O.overflowY === "auto" || O.overflowY === "scroll" || O.overflowY === "visible")) : (R = $ < I && (O.overflowX === "auto" || O.overflowX === "scroll"), T = b < F && (O.overflowY === "auto" || O.overflowY === "scroll"));
      var Z = R && (Math.abs(k - n) <= a && A + $ < I) - (Math.abs(v - n) <= a && !!A), V = T && (Math.abs(m - o) <= a && B + b < F) - (Math.abs(g - o) <= a && !!B);
      if (!M[u])
        for (var pt = 0; pt <= u; pt++)
          M[pt] || (M[pt] = {});
      (M[u].vx != Z || M[u].vy != V || M[u].el !== _) && (M[u].el = _, M[u].vx = Z, M[u].vy = V, clearInterval(M[u].pid), (Z != 0 || V != 0) && (l = !0, M[u].pid = setInterval((function() {
        i && this.layer === 0 && x.active._onTouchMove(ye);
        var Lt = M[this.layer].vy ? M[this.layer].vy * s : 0, at = M[this.layer].vx ? M[this.layer].vx * s : 0;
        typeof d == "function" && d.call(x.dragged.parentNode[q], at, Lt, r, ye, M[this.layer].el) !== "continue" || gn(M[this.layer].el, at, Lt);
      }).bind({
        layer: u
      }), 24))), u++;
    } while (t.bubbleScroll && p !== c && (p = dt(p, !1)));
    ii = l;
  }
}, 30), xn = function(t) {
  var e = t.originalEvent, i = t.putSortable, n = t.dragEl, o = t.activeSortable, a = t.dispatchSortableEvent, s = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var l = i || o;
    s();
    var d = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, u = document.elementFromPoint(d.clientX, d.clientY);
    c(), l && !l.el.contains(u) && (a("spill"), this.onSpill({
      dragEl: n,
      putSortable: i
    }));
  }
};
function pi() {
}
pi.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var n = Rt(this.sortable.el, this.startIndex, this.options);
    n ? this.sortable.el.insertBefore(e, n) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: xn
};
nt(pi, {
  pluginName: "revertOnSpill"
});
function gi() {
}
gi.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, n = i || this.sortable;
    n.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), n.animateAll();
  },
  drop: xn
};
nt(gi, {
  pluginName: "removeOnSpill"
});
x.mount(new No());
x.mount(gi, pi);
function Fo(r) {
  const t = r.toLowerCase(), e = {
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
function Bo(r) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[r] ?? "mdi:map-marker";
}
function jo(r) {
  const t = String(r ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function Sn(r) {
  var n;
  const t = (n = r.modules) == null ? void 0 : n._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = Fo(r.name);
  if (e) return e;
  const i = jo(t == null ? void 0 : t.type);
  return Bo(i);
}
const Uo = 24, Wo = 0.18, Ho = 6;
function Ko(r, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const n of r) {
      const o = n.location.parent_id;
      o && e.has(o) && !e.has(n.location.id) && (e.add(n.location.id), i = !0);
    }
  }
  return e;
}
function Fi(r, t) {
  const e = new Map(r.map((u) => [u.id, u])), i = /* @__PURE__ */ new Map(), n = (u) => {
    const p = u.parent_id;
    return !p || p === u.id || !e.has(p) ? null : p;
  };
  for (const u of r) {
    const p = n(u);
    i.has(p) || i.set(p, []), i.get(p).push(u);
  }
  const o = [], a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), l = [...i.get(null) || []];
  for (; l.length; ) {
    const u = l.pop();
    if (!s.has(u.id)) {
      s.add(u.id);
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
  for (const u of r) {
    if (s.has(u.id) || a.has(u.id)) continue;
    a.add(u.id);
    const _ = (i.get(u.id) || []).length > 0, h = t.has(u.id);
    o.push({ location: u, depth: 0, hasChildren: _, isExpanded: h }), h && _ && d(u.id, 1);
  }
  return o;
}
function Bi(r, t, e, i) {
  if (i) {
    const s = r.left;
    if (t >= s && t < s + Uo) return "outdent";
  }
  const n = e - r.top, o = Math.max(r.height, 1), a = Math.min(
    o / 3,
    Math.max(Ho, o * Wo)
  );
  return n < a ? "before" : n >= o - a ? "after" : "inside";
}
function qo(r, t, e, i, n) {
  const o = Ko(r, t), a = r.filter((u) => !o.has(u.location.id)), s = a.find((u) => u.location.id === i);
  if (!s) return { parentId: e, siblingIndex: 0 };
  const c = n === "inside" ? i : s.location.parent_id, l = a.filter((u) => u.location.parent_id === c), d = l.findIndex((u) => u.location.id === i);
  return n === "inside" ? { parentId: i, siblingIndex: l.length } : n === "before" ? { parentId: c, siblingIndex: d >= 0 ? d : 0 } : n === "after" ? { parentId: c, siblingIndex: Math.min(d >= 0 ? d + 1 : l.length, l.length) } : { parentId: c, siblingIndex: d >= 0 ? d : 0 };
}
const ji = "application/x-topomation-entity-id", be = class be extends ht {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var a;
    const e = ((a = t.dragged) == null ? void 0 : a.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const n = i.getAttribute("data-id") || void 0;
    if (n && n !== e && !Je(this.locations, e, n))
      return n;
    let o = i;
    for (; o; ) {
      if (o.classList.contains("tree-item")) {
        const s = o.getAttribute("data-id") || void 0;
        if (s && s !== e && !Je(this.locations, e, s))
          return s;
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
      e && (this._sortable = x.create(e, {
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
          var s;
          const o = ((s = n.dragged) == null ? void 0 : s.getAttribute("data-id")) || void 0, a = n.related;
          if (o && (a != null && a.classList.contains("tree-item"))) {
            const c = this._resolveRelatedId(n) ?? a.getAttribute("data-id") ?? void 0;
            if (!c || c === o)
              return this._activeDropTarget = void 0, this._dropIndicator = void 0, !0;
            const l = a.getBoundingClientRect(), d = n.originalEvent, u = typeof (d == null ? void 0 : d.clientX) == "number" ? d.clientX : l.left + l.width / 2, p = typeof (d == null ? void 0 : d.clientY) == "number" ? d.clientY : l.top + l.height / 2, _ = this.locations.find((v) => v.id === o), h = (_ == null ? void 0 : _.parent_id) ?? null, m = Bi(l, u, p, c === h);
            this._activeDropTarget = { relatedId: c, zone: m }, this._updateDropIndicator(o, a, m);
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
    const a = Fi(this.locations, this._expandedIds), s = qo(
      a,
      i,
      n.parent_id,
      o.relatedId,
      o.zone
    ), { parentId: c, siblingIndex: l } = s, d = a.filter((u) => u.location.parent_id === n.parent_id).findIndex((u) => u.location.id === i);
    if (c === n.parent_id && l === d) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!to({ locations: this.locations, locationId: i, newParentId: c })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: i, newParentId: c, newIndex: l },
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
    const o = i.getBoundingClientRect(), a = this.locations.find((p) => p.id === e), s = (a == null ? void 0 : a.parent_id) ?? null, c = n === s, l = Bi(o, t.clientX, t.clientY, c);
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
    const o = n.getBoundingClientRect(), a = e.getBoundingClientRect(), s = i === "inside" ? "child" : i === "outdent" ? "outdent" : "sibling", c = i === "inside" ? "Child" : i === "outdent" ? "Outdent" : i === "after" ? "After" : "Before";
    let l = a.left - o.left + 6;
    i === "inside" && (l += 24), i === "outdent" && (l -= 24), l = Math.max(8, Math.min(l, o.width - 44));
    const d = Math.max(36, o.width - l - 8), u = i === "after" ? a.bottom - o.top : i === "before" ? a.top - o.top : i === "inside" ? a.bottom - o.top : a.top - o.top;
    this._dropIndicator = { top: u, left: l, width: d, intent: s, label: c };
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
      return f`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? f`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : f`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Fi(this._visibleTreeLocations(), this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return f`
      <div class="tree-list">
        ${Qe(
      t,
      (n) => `${this.version}:${n.location.id}:${n.depth}`,
      (n) => this._renderItem(
        n,
        e[n.location.id] || "unknown",
        i[n.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? f`
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
    var $;
    const { location: n, depth: o, hasChildren: a, isExpanded: s } = t, c = this.selectedId === n.id, l = this._editingId === n.id, d = o * 24, u = P(n), p = n.is_explicit_root ? "root" : u, _ = n.is_explicit_root ? "home root" : u, h = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", g = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", m = (($ = this.occupancyStates) == null ? void 0 : $[n.id]) === !0, v = "mdi:home-switch-outline", k = m ? "Set vacant" : "Set occupied";
    return f`
      <div
        class="tree-item ${c ? "selected" : ""} ${u === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === n.id ? "entity-drop-target" : ""}"
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
          class="expand-btn ${s ? "expanded" : ""} ${a ? "" : "hidden"}"
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

        ${l ? f`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(b) => this._editingValue = b.target.value}
                  @blur=${() => this._finishEditing(n.id)}
                  @keydown=${(b) => this._handleEditKeydown(b, n.id)}
                  @click=${(b) => b.stopPropagation()} />` : f`<div
              class="location-name"
              @dblclick=${this.allowRename ? (b) => this._startEditing(b, n) : () => {
    }}
            >${n.name}</div>`}

        <span class="type-badge ${p}">${_}</span>

        ${n.is_explicit_root || this.readOnly ? "" : f`
              <button
                class="occupancy-btn"
                title=${k}
                @click=${(b) => this._handleOccupancyToggle(b, n, m)}
              >
                <ha-icon .icon=${v}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${g}
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
      const s = n.get(a);
      if (s) return s;
      if (!e.has(a)) return "unknown";
      const c = (_ = this.occupancyStates) == null ? void 0 : _[a], l = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", d = i.get(a) || [];
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
      const s = o.locked_by;
      e[String(a)] = {
        isLocked: !!o.is_locked,
        lockedBy: Array.isArray(s) ? s.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _visibleTreeLocations() {
    const t = Ae(this.locations);
    return this.locations.filter(
      (e) => !this._isManagedShadowLocation(e, t)
    );
  }
  _isManagedShadowLocation(t, e) {
    return Ee(t, e);
  }
  _getIcon(t) {
    var e, i, n;
    return t.ha_area_id && ((n = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t.ha_area_id]) != null && n.icon) ? this.hass.areas[t.ha_area_id].icon : Sn(t);
  }
  _hasEntityDragPayload(t) {
    var i;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.types) || []);
    return e.includes(ji) ? !0 : !this._isDragging && e.includes("text/plain");
  }
  _readEntityIdFromDrop(t) {
    var n, o;
    const e = (n = t.dataTransfer) == null ? void 0 : n.getData(ji);
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
          for (const s of this.locations)
            s.parent_id === a && (i.delete(s.id), n.push(s.id));
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
be.properties = {
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
}, be.styles = [
  $e,
  Jt`
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
let ni = be;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", ni);
const lt = 30 * 60, Ui = 5 * 60;
function kn(r) {
  if (!r) return "";
  const t = r.indexOf(".");
  return t >= 0 ? r.slice(0, t) : "";
}
function Vo(r) {
  return ["door", "garage_door", "opening", "window"].includes(r || "");
}
function Go(r) {
  return ["presence", "occupancy"].includes(r || "");
}
function Yo(r) {
  return r === "motion";
}
function $n(r) {
  return r === "media_player";
}
function An(r) {
  var i;
  const t = kn(r == null ? void 0 : r.entity_id), e = (i = r == null ? void 0 : r.attributes) == null ? void 0 : i.device_class;
  if ($n(t))
    return {
      entity_id: (r == null ? void 0 : r.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: lt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (r == null ? void 0 : r.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: lt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (r == null ? void 0 : r.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Ui
    };
  if (t === "binary_sensor") {
    if (Go(e))
      return {
        entity_id: (r == null ? void 0 : r.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Ui
      };
    if (Yo(e))
      return {
        entity_id: (r == null ? void 0 : r.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: lt,
        off_event: "none",
        off_trailing: 0
      };
    if (Vo(e))
      return {
        entity_id: (r == null ? void 0 : r.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: lt,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (r == null ? void 0 : r.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: lt,
    off_event: "none",
    off_trailing: 0
  };
}
function He(r, t, e) {
  const i = kn(e == null ? void 0 : e.entity_id), n = An(e);
  if ($n(i)) {
    const a = r.on_timeout && r.on_timeout > 0 ? r.on_timeout : lt;
    return {
      ...r,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const a = r.on_timeout ?? (n.mode === "any_change" ? n.on_timeout : lt);
    return {
      ...r,
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
    on_timeout: lt,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...r,
    mode: t,
    on_event: r.on_event ?? o.on_event,
    on_timeout: r.on_timeout ?? o.on_timeout,
    off_event: r.off_event ?? o.off_event,
    off_trailing: r.off_trailing ?? o.off_trailing
  };
}
const En = "topomation_", Ke = "[topomation]", Xo = "topomation/actions/rules/list", Jo = "topomation/actions/rules/create", Qo = "topomation/actions/rules/delete";
function Zo(r) {
  if (!r || typeof r != "object") return;
  const t = r;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function _i(r) {
  const t = Zo(r);
  if (t && ["unknown_command", "not_found", "invalid_format", "unknown_error"].includes(t))
    return !0;
  const e = Dn(r).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function ve(r) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${r}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function fi(r) {
  const t = String(r || "").trim().toLowerCase();
  return t === "occupied" ? "on_occupied" : t === "vacant" ? "on_vacant" : t === "on_occupied" || t === "on_vacant" || t === "on_dark" || t === "on_bright" ? t : null;
}
function ta(r) {
  return r === "on_dark" ? "dark" : r === "on_bright" ? "bright" : "any";
}
function Te(r, t, e) {
  const i = String(t || "").trim().toLowerCase();
  return i === "any" || i === "dark" || i === "bright" ? i : e ? "dark" : ta(r);
}
function ea(r) {
  if (typeof r != "string" || !r.includes(Ke))
    return null;
  const t = r.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(Ke)) continue;
    const i = e.slice(Ke.length).trim();
    if (!i) return null;
    try {
      const n = JSON.parse(i), o = fi(n == null ? void 0 : n.trigger_type);
      if (typeof (n == null ? void 0 : n.location_id) == "string" && o)
        return {
          version: Number(n.version) || 1,
          location_id: n.location_id,
          trigger_type: o,
          rule_uuid: typeof n.rule_uuid == "string" && n.rule_uuid.trim().length > 0 ? n.rule_uuid.trim() : void 0,
          ambient_condition: Te(
            o,
            n.ambient_condition,
            !!n.require_dark
          ),
          must_be_occupied: !!n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: typeof n.start_time == "string" && n.start_time.trim().length > 0 ? n.start_time.trim() : void 0,
          end_time: typeof n.end_time == "string" && n.end_time.trim().length > 0 ? n.end_time.trim() : void 0,
          require_dark: typeof n.require_dark == "boolean" ? n.require_dark : void 0
        };
    } catch {
      return null;
    }
  }
  return null;
}
function Bt(r) {
  if (!r || typeof r != "object" || Array.isArray(r)) return;
  const t = { ...r };
  if (delete t.entity_id, Object.prototype.hasOwnProperty.call(t, "brightness_pct")) {
    const e = Number(t.brightness_pct);
    Number.isFinite(e) && e > 0 ? t.brightness_pct = Math.max(1, Math.min(100, Math.round(e))) : delete t.brightness_pct;
  }
  for (const [e, i] of Object.entries(t))
    (i == null || i === "") && delete t[e];
  return Object.keys(t).length > 0 ? t : void 0;
}
function ia(r) {
  var c, l;
  if (!r || typeof r != "object" || Array.isArray(r))
    return;
  const t = r, e = typeof t.action == "string" ? t.action : "", i = e.includes(".") ? e.split(".").slice(1).join(".") : e, n = String(i || "").trim();
  if (!n)
    return;
  const o = Bt(t == null ? void 0 : t.data), a = (c = t == null ? void 0 : t.target) == null ? void 0 : c.entity_id;
  if (typeof a == "string" && a.trim().length > 0)
    return {
      entity_id: a.trim(),
      service: n,
      ...o ? { data: o } : {}
    };
  if (Array.isArray(a)) {
    const d = a.find((u) => typeof u == "string" && u.trim().length > 0);
    if (typeof d == "string")
      return {
        entity_id: d.trim(),
        service: n,
        ...o ? { data: o } : {}
      };
  }
  const s = (l = t == null ? void 0 : t.data) == null ? void 0 : l.entity_id;
  if (typeof s == "string" && s.trim().length > 0)
    return {
      entity_id: s.trim(),
      service: n,
      ...o ? { data: o } : {}
    };
}
function na(r) {
  const t = (r == null ? void 0 : r.actions) ?? (r == null ? void 0 : r.action);
  return (Array.isArray(t) ? t : t ? [t] : []).map((n) => ia(n)).filter((n) => !!n);
}
function oa(r) {
  const t = na(r);
  if (t.length === 0)
    return {};
  const e = t[0];
  return {
    actions: t,
    action_entity_id: e.entity_id,
    action_service: e.service,
    action_data: e.data
  };
}
function oi(r, t) {
  const i = (Array.isArray(r.actions) ? r.actions : []).map((s) => {
    if (!s || typeof s != "object") return;
    const c = String(s.entity_id || "").trim();
    if (!c) return;
    const d = String(s.service || "").trim() || defaultActionServiceForTrigger(c, t);
    return {
      entity_id: c,
      service: d,
      ...Bt(s.data) ? { data: Bt(s.data) } : {}
    };
  }).filter((s) => !!s);
  if (i.length > 0)
    return i;
  const n = String(r.action_entity_id || "").trim();
  if (!n) return [];
  const a = String(r.action_service || "").trim() || defaultActionServiceForTrigger(n, t);
  return [
    {
      entity_id: n,
      service: a,
      ...Bt(r.action_data) ? { data: Bt(r.action_data) } : {}
    }
  ];
}
function Wi(r) {
  const t = (r == null ? void 0 : r.conditions) ?? (r == null ? void 0 : r.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
  for (; e.length > 0; ) {
    const i = e.pop();
    if (!i || typeof i != "object") continue;
    if (i.condition === "state" && i.entity_id === "sun.sun" && i.state === "below_horizon")
      return !0;
    const n = i.conditions;
    Array.isArray(n) && e.push(...n);
  }
  return !1;
}
async function aa(r) {
  try {
    const t = await r.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? {
      entries: t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation"),
      usedStateFallback: !1
    } : {
      entries: [],
      usedStateFallback: !1
    };
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), {
      entries: Object.keys(r.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e })),
      usedStateFallback: !0
    };
  }
}
function ra(r, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof r.unique_id == "string" ? r.unique_id.trim() : "";
  if (i) return i;
}
function sa(r) {
  return !!((typeof r.unique_id == "string" ? r.unique_id.trim().toLowerCase() : "").startsWith(En) || (Array.isArray(r.labels) ? r.labels : []).some(
    (n) => typeof n == "string" && n.toLowerCase().includes("topomation")
  ) || Object.values(r.categories || {}).some(
    (n) => typeof n == "string" && n.toLowerCase().includes("topomation")
  ));
}
function ca(r) {
  return Object.entries(r.states || {}).some(([t, e]) => {
    var n;
    if (!t.startsWith("automation.")) return !1;
    const i = (n = e == null ? void 0 : e.attributes) == null ? void 0 : n.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(En);
  });
}
function Dn(r) {
  if (typeof r == "string" && r.trim()) return r.trim();
  if (r instanceof Error && r.message.trim()) return r.message.trim();
  if (r && typeof r == "object" && "message" in r) {
    const t = r.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function la(r, t) {
  const i = (await aa(r)).entries, n = i.filter(sa), o = n.length > 0 ? n : i, a = [], c = (await Promise.all(
    o.map(async (u) => {
      var p, _;
      if (u.entity_id)
        try {
          const h = await r.callWS({
            type: "automation/config",
            entity_id: u.entity_id
          }), g = h == null ? void 0 : h.config;
          if (!g || typeof g != "object")
            return;
          const m = ea(g.description);
          if (!m || m.location_id !== t)
            return;
          const v = ra(u, g), k = oa(g), $ = (p = r.states) == null ? void 0 : p[u.entity_id], b = $ ? $.state !== "off" : !0, R = typeof g.alias == "string" && g.alias.trim() || ((_ = $ == null ? void 0 : $.attributes) == null ? void 0 : _.friendly_name) || u.entity_id;
          return {
            id: v || u.entity_id,
            entity_id: u.entity_id,
            name: R,
            trigger_type: m.trigger_type,
            rule_uuid: m.rule_uuid,
            actions: k.actions,
            action_entity_id: k.action_entity_id,
            action_service: k.action_service,
            action_data: k.action_data,
            ambient_condition: Te(
              m.trigger_type,
              m.ambient_condition,
              typeof m.require_dark == "boolean" ? m.require_dark : Wi(g)
            ),
            must_be_occupied: !!m.must_be_occupied,
            time_condition_enabled: !!m.time_condition_enabled,
            start_time: m.start_time,
            end_time: m.end_time,
            require_dark: typeof m.require_dark == "boolean" ? m.require_dark : Wi(g),
            enabled: b
          };
        } catch (h) {
          a.push({
            entity_id: u.entity_id,
            error: h
          }), console.debug("[ha-automation-rules] failed to read automation config", u.entity_id, h);
          return;
        }
    })
  )).filter((u) => !!u).sort((u, p) => u.name.localeCompare(p.name)), l = o.length > 0 && a.length === o.length, d = n.length > 0 || ca(r);
  if (c.length === 0 && l && d) {
    const u = a[0], p = u ? Dn(u.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${p}`);
  }
  return c;
}
async function Mt(r, t, e) {
  try {
    const i = await r.callWS({
      type: Xo,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return i.rules.map((n) => {
        const o = fi(n.trigger_type);
        if (!o) return null;
        const a = !!n.require_dark, s = Te(
          o,
          n.ambient_condition,
          a
        ), c = oi(n, o), l = c[0];
        return {
          ...n,
          trigger_type: o,
          actions: c,
          ambient_condition: s,
          must_be_occupied: !!n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: typeof n.start_time == "string" && n.start_time.length > 0 ? n.start_time : void 0,
          end_time: typeof n.end_time == "string" && n.end_time.length > 0 ? n.end_time : void 0,
          require_dark: a || s === "dark",
          action_entity_id: l == null ? void 0 : l.entity_id,
          action_service: l == null ? void 0 : l.service,
          action_data: l == null ? void 0 : l.data
        };
      }).filter((n) => !!n).sort((n, o) => n.name.localeCompare(o.name));
  } catch (i) {
    if (!_i(i))
      throw i;
  }
  return la(r, t);
}
async function Hi(r, t, e) {
  const i = oi(
    {
      actions: t.actions,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service,
      action_data: t.action_data
    },
    t.trigger_type
  ), n = i[0];
  if (!n)
    throw new Error("At least one action target is required");
  try {
    const o = await r.callWS({
      type: Jo,
      location_id: t.location.id,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: n.entity_id,
      action_service: n.service,
      action_data: n.data,
      actions: i,
      ambient_condition: t.ambient_condition,
      must_be_occupied: !!t.must_be_occupied,
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: t.start_time,
      end_time: t.end_time,
      require_dark: !!t.require_dark,
      ...t.automation_id ? { automation_id: t.automation_id } : {},
      ...t.rule_uuid ? { rule_uuid: t.rule_uuid } : {},
      ...e ? { entry_id: e } : {}
    });
    if (o != null && o.rule) {
      const a = fi(o.rule.trigger_type) || t.trigger_type, s = !!o.rule.require_dark, c = Te(
        a,
        o.rule.ambient_condition,
        s
      ), l = oi(o.rule, a), d = l[0] || n;
      return {
        ...o.rule,
        trigger_type: a,
        rule_uuid: typeof o.rule.rule_uuid == "string" && o.rule.rule_uuid.trim().length > 0 ? o.rule.rule_uuid.trim() : t.rule_uuid,
        actions: l,
        ambient_condition: c,
        action_entity_id: d == null ? void 0 : d.entity_id,
        action_service: d == null ? void 0 : d.service,
        action_data: d == null ? void 0 : d.data,
        must_be_occupied: !!o.rule.must_be_occupied,
        time_condition_enabled: !!o.rule.time_condition_enabled,
        start_time: typeof o.rule.start_time == "string" && o.rule.start_time.length > 0 ? o.rule.start_time : void 0,
        end_time: typeof o.rule.end_time == "string" && o.rule.end_time.length > 0 ? o.rule.end_time : void 0,
        require_dark: s || c === "dark"
      };
    }
  } catch (o) {
    throw _i(o) ? ve("rule creation") : o;
  }
  throw ve("rule creation");
}
async function Ki(r, t, e) {
  const i = typeof t == "string" ? t : t.id, n = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const o = await r.callWS({
      type: Qo,
      automation_id: i,
      ...n ? { entity_id: n } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((o == null ? void 0 : o.success) === !0)
      return;
  } catch (o) {
    throw _i(o) ? ve("rule deletion") : o;
  }
  throw ve("rule deletion");
}
var Yi, Xi;
try {
  (Xi = (Yi = import.meta) == null ? void 0 : Yi.hot) == null || Xi.accept(() => window.location.reload());
} catch {
}
const we = class we extends ht {
  constructor() {
    super(...arguments), this.allLocations = [], this.adjacencyEdges = [], this.entityRegistryRevision = 0, this.occupancyStates = {}, this.occupancyTransitions = {}, this.handoffTraces = [], this._activeTab = "detection", this._occupancyDraftDirty = !1, this._savingOccupancyDraft = !1, this._pendingOccupancyByLocation = {}, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._actionRulesDraftDirty = !1, this._savingActionRules = !1, this._loadingActionRules = !1, this._liveOccupancyStateByLocation = {}, this._nowEpochMs = Date.now(), this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._syncImportInProgress = !1, this._showAdvancedAdjacency = !1, this._showRecentOccupancyEvents = !1, this._adjacencyNeighborId = "", this._adjacencyBoundaryType = "door", this._adjacencyDirection = "bidirectional", this._adjacencyCrossingSources = "", this._adjacencyHandoffWindowSec = 12, this._adjacencyPriority = 50, this._savingAdjacency = !1, this._wiabInteriorEntityId = "", this._wiabDoorEntityId = "", this._wiabExteriorDoorEntityId = "", this._wiabShowAllEntities = !1, this._ambientDraftDirty = !1, this._loadingAmbientReading = !1, this._savingAmbientConfig = !1, this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._ambientReadingLoadSeq = 0, this._beforeUnloadHandler = (t) => {
      this._hasUnsavedDrafts() && (t.preventDefault(), t.returnValue = "");
    };
  }
  render() {
    return this.location ? f`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    ` : f`
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
    if (t.has("hass") && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this._liveOccupancyStateByLocation = {}, this.hass && (this._loadEntityAreaAssignments(), this._loadActionRules(), this._subscribeAutomationStateChanged())), t.has("forcedTab")) {
      const i = this._mapRequestedTab(this.forcedTab);
      i ? this._activeTab = i : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const i = t.get("location"), n = (i == null ? void 0 : i.id) || "", o = ((e = this.location) == null ? void 0 : e.id) || "";
      n !== o ? (this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._externalAreaId = "", this._externalEntityId = "", this._wiabShowAllEntities = !1, this._showAdvancedAdjacency = !1, this._showRecentOccupancyEvents = !1, this._onTimeoutMemory = {}, this._actionRulesDraft = void 0, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._ambientReading = void 0, this._ambientReadingError = void 0, this._occupancyDraft = void 0, this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {}, this._ambientDraft = void 0, this._ambientDraftDirty = !1, this._ambientSaveError = void 0, this._resetDetectionDraftFromLocation(), this._resetAmbientDraftFromLocation(), this.hass && this._loadEntityAreaAssignments(), this._loadAmbientReading()) : (this._occupancyDraftDirty || this._resetDetectionDraftFromLocation(), this._ambientDraftDirty || this._resetAmbientDraftFromLocation()), this._loadActionRules();
    }
    if (t.has("entryId")) {
      const i = t.get("entryId") || "", n = this.entryId || "";
      i !== n && (this._loadActionRules(), this._loadAmbientReading());
    }
    t.has("entityRegistryRevision") && this._loadEntityAreaAssignments();
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const n = await Mt(this.hass, e, this.entryId);
      if (t !== this._actionRulesLoadSeq) return !1;
      const o = this._actionRulesSignature(this._actionRules), a = this._actionRulesSignature(n), s = o !== a;
      return this._actionRules = n, this._actionRulesDraftDirty ? s && (this._resetActionRulesDraftFromLoaded(), this._showToast(
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
      action_entity_id: String(i.action_entity_id || ""),
      action_service: String(i.action_service || ""),
      ambient_condition: String(i.ambient_condition || ""),
      must_be_occupied: !!i.must_be_occupied,
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
      occupancy_sources: [],
      linked_locations: [],
      sync_locations: [],
      wiab: {
        preset: "off"
      }
    };
  }
  _sanitizeOccupancyConfig(t, e = ((i) => (i = this.location) == null ? void 0 : i.id)()) {
    const n = this._occupancyDefaults(), a = (Array.isArray(t.occupancy_sources) ? t.occupancy_sources : []).filter((d) => d && typeof d.entity_id == "string" && d.entity_id.trim().length > 0).map((d) => this._normalizeSource(d.entity_id.trim(), d)), s = Math.max(1, Number(t.default_timeout) || n.default_timeout), c = Math.max(
      0,
      Number(t.default_trailing_timeout) || n.default_trailing_timeout || 0
    ), l = {
      ...n,
      ...t,
      enabled: t.enabled !== !1,
      default_timeout: s,
      default_trailing_timeout: c,
      occupancy_sources: a,
      linked_locations: this._normalizeLinkedLocationIds(t.linked_locations, void 0, e),
      sync_locations: this._normalizeLinkedLocationIds(t.sync_locations, void 0, e)
    };
    return l.wiab = this._getWiabConfig(l), l;
  }
  _persistedOccupancyConfig() {
    var e, i, n;
    const t = ((i = (e = this.location) == null ? void 0 : e.modules) == null ? void 0 : i.occupancy) || {};
    return this._sanitizeOccupancyConfig(t, (n = this.location) == null ? void 0 : n.id);
  }
  _resetDetectionDraftFromLocation() {
    if (!this.location) {
      this._occupancyDraft = void 0, this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {};
      return;
    }
    this._occupancyDraft = this._persistedOccupancyConfig(), this._occupancyDraftDirty = !1, this._occupancySaveError = void 0, this._pendingOccupancyByLocation = {};
  }
  _setOccupancyDraft(t) {
    var e;
    this._occupancyDraft = this._sanitizeOccupancyConfig(t, (e = this.location) == null ? void 0 : e.id), this._occupancyDraftDirty = !0, this._occupancySaveError = void 0, this.requestUpdate();
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
    }, this._occupancyDraftDirty = !0, this._occupancySaveError = void 0, this.requestUpdate();
  }
  _renderDetectionDraftToolbar() {
    const t = this._occupancyDraftDirty, e = this._savingOccupancyDraft;
    return f`
      <div class="draft-toolbar" data-testid="detection-draft-toolbar">
        <div class="draft-toolbar-note">${t ? "Detection changes are not saved." : "Detection changes saved."}</div>
        <div class="draft-toolbar-actions">
          <button
            class="button button-secondary"
            type="button"
            data-testid="detection-discard-button"
            ?disabled=${e || !t}
            @click=${() => this._discardDetectionDraft()}
          >
            Discard
          </button>
          <button
            class="dusk-save-button ${t ? "dirty" : ""}"
            type="button"
            data-testid="detection-save-button"
            ?disabled=${e || !t}
            @click=${() => this._saveDetectionDraft()}
          >
            ${e ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
      ${this._occupancySaveError ? f`<div class="policy-warning" data-testid="detection-save-error">${this._occupancySaveError}</div>` : ""}
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
        const a = (this.allLocations || []).find((s) => s.id === o.locationId);
        a && (a.modules = a.modules || {}, a.modules.occupancy = o.config);
      }
      this._resetDetectionDraftFromLocation(), this._showToast("Detection settings updated", "success");
    } catch (o) {
      console.error("Failed to update detection settings", o), this._occupancySaveError = (o == null ? void 0 : o.message) || "Failed to update detection settings", this._showToast(this._occupancySaveError, "error");
    } finally {
      this._savingOccupancyDraft = !1, this.requestUpdate();
    }
  }
  _discardDetectionDraft(t = !0) {
    this._resetDetectionDraftFromLocation(), t && this._showToast("Discarded detection changes", "success");
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
    const e = this._ambientDefaults(), i = Math.max(0, Number(t.dark_threshold) || 0), n = Math.max(
      Math.max(1, i) + 1,
      Number(t.bright_threshold) || 0
    );
    return {
      ...e,
      ...t,
      auto_discover: !1,
      dark_threshold: i,
      bright_threshold: n
    };
  }
  _resetAmbientDraftFromLocation() {
    this._ambientDraft = this._persistedAmbientConfig(), this._ambientDraftDirty = !1, this._ambientSaveError = void 0;
  }
  _getAmbientConfig() {
    return this.location ? this._sanitizeAmbientConfig(this._ambientDraft || this._persistedAmbientConfig()) : this._sanitizeAmbientConfig(this._ambientDefaults());
  }
  _setAmbientDraft(t) {
    this._ambientDraft = this._sanitizeAmbientConfig(t), this._ambientDraftDirty = !0, this._ambientSaveError = void 0, this.requestUpdate();
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
      this._savingAmbientConfig = !1;
    }
  }
  _discardAmbientDraft(t = !0) {
    this._resetAmbientDraftFromLocation(), this._loadAmbientReading(), t && this._showToast("Discarded ambient changes", "success");
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
      this._ambientReading = i, this._ambientReadingError = void 0;
    } catch (e) {
      if (t !== this._ambientReadingLoadSeq) return;
      this._ambientReading = void 0, this._ambientReadingError = (e == null ? void 0 : e.message) || "Failed to load ambient reading";
    } finally {
      t === this._ambientReadingLoadSeq && (this._loadingAmbientReading = !1, this.requestUpdate());
    }
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
  _ambientSensorCandidates() {
    var i, n, o;
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set(), e = this._getAmbientConfig();
    typeof e.lux_sensor == "string" && e.lux_sensor.trim() && t.add(e.lux_sensor.trim());
    for (const a of this.location.entity_ids || [])
      this._isLuxSensorEntity(a) && t.add(a);
    if (this.location.ha_area_id) {
      const a = ((i = this.hass) == null ? void 0 : i.states) || {};
      for (const s of Object.keys(a)) {
        const c = this._entityAreaById[s];
        (c !== void 0 ? c : (o = (n = a[s]) == null ? void 0 : n.attributes) == null ? void 0 : o.area_id) === this.location.ha_area_id && this._isLuxSensorEntity(s) && t.add(s);
      }
    }
    return [...t].sort((a, s) => this._entityName(a).localeCompare(this._entityName(s)));
  }
  _isLuxSensorEntity(t) {
    var i, n;
    const e = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t];
    return this._isLuxSensorEntityForState(t, e);
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
  _duskDawnDefaults() {
    return {
      version: 3,
      blocks: []
    };
  }
  _normalizeDuskDawnTriggerMode(t) {
    return t === "on_occupied" ? "on_occupied" : t === "on_vacant" ? "on_vacant" : t === "on_dark" ? "on_dark" : t === "on_bright" ? "on_bright" : t === "while_dark_on_occupancy" ? "on_occupied" : "on_dark";
  }
  _defaultAmbientConditionForTrigger(t) {
    return "any";
  }
  _lockedAmbientConditionForTrigger(t) {
    if (t === "on_dark") return "dark";
    if (t === "on_bright") return "bright";
  }
  _isAmbientConditionLockedByTrigger(t) {
    return this._lockedAmbientConditionForTrigger(t) !== void 0;
  }
  _lockedMustBeOccupiedForTrigger(t) {
    if (t === "on_occupied") return !0;
    if (t === "on_vacant") return !1;
  }
  _isMustBeOccupiedLockedByTrigger(t) {
    return this._lockedMustBeOccupiedForTrigger(t) !== void 0;
  }
  _applyTriggerDerivedBlockConstraints(t) {
    const e = this._normalizeDuskDawnTriggerMode(t.trigger_mode), i = { ...t }, n = this._lockedAmbientConditionForTrigger(e);
    n !== void 0 && (i.ambient_condition = n);
    const o = this._lockedMustBeOccupiedForTrigger(e);
    return o !== void 0 && (i.must_be_occupied = o), i;
  }
  _normalizeDuskDawnAmbientCondition(t, e) {
    const i = this._lockedAmbientConditionForTrigger(e);
    return i !== void 0 ? i : t === "dark" ? "dark" : t === "bright" ? "bright" : t === "any" ? "any" : this._defaultAmbientConditionForTrigger(e);
  }
  _normalizeDuskDawnMustBeOccupied(t, e) {
    const i = this._normalizeDuskDawnTriggerMode(e), n = this._lockedMustBeOccupiedForTrigger(i);
    return n !== void 0 ? n : typeof t == "boolean" ? t : e === "at_dark_if_occupied";
  }
  _normalizeDuskDawnAlreadyOnBehavior(t) {
    return "set_target";
  }
  _timeToMinutes(t) {
    const i = String(t || "").trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (i)
      return Number(i[1]) * 60 + Number(i[2]);
  }
  _normalizeDuskDawnStartTime(t, e) {
    const i = typeof t == "string" ? t.trim() : "";
    return this._timeToMinutes(i) !== void 0 ? i : e;
  }
  _clampBrightnessPct(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) ? Math.max(1, Math.min(100, Math.round(i))) : Math.max(1, Math.min(100, e));
  }
  _normalizeColorHex(t, e) {
    const i = typeof t == "string" ? t.trim() : "", n = i.startsWith("#") ? i : i ? `#${i}` : "";
    return /^#[0-9a-fA-F]{6}$/.test(n) ? n.toLowerCase() : e;
  }
  _normalizeDuskDawnBlockId(t, e) {
    return (typeof t == "string" ? t.trim() : "") || e;
  }
  _normalizeLegacyDuskDawnRuleName(t, e) {
    const i = typeof t == "string" ? t.trim() : "";
    if (!i) return `Rule ${e + 1}`;
    const n = i.match(/^block\s+(\d+)$/i);
    return n ? `Rule ${n[1]}` : i;
  }
  _isPlaceholderRuleName(t) {
    const e = typeof t == "string" ? t.trim() : "";
    return e ? /^rule\s+\d+$/i.test(e) || /^block\s+\d+$/i.test(e) : !0;
  }
  _humanizeEntityId(t) {
    const e = String(t || "").trim();
    if (!e) return "Device";
    const [, i = e] = e.split(".", 2);
    return i.replace(/[_\s]+/g, " ").trim().replace(/\b\w/g, (o) => o.toUpperCase()) || e;
  }
  _lightingTriggerLabel(t) {
    return t === "on_occupied" ? "On occupied" : t === "on_vacant" ? "On vacant" : t === "on_bright" ? "On bright" : "On dark";
  }
  _autoLightingRuleName(t, e) {
    const i = this._normalizeDuskDawnTriggerMode(t.trigger_mode);
    let n = this._lightingTriggerLabel(i);
    const o = this._sanitizeDuskDawnLightTargets(t.light_targets);
    if (o.length > 0) {
      const a = this._humanizeEntityId(o[0].entity_id), s = o.length > 1 ? ` +${o.length - 1}` : "";
      n = `${n}: ${a}${s}`;
    }
    if (t.time_condition_enabled) {
      const a = this._normalizeDuskDawnStartTime(t.start_time, "18:00"), s = this._normalizeDuskDawnStartTime(t.end_time, "23:59");
      n = `${n} (${a}-${s})`;
    }
    return n === this._lightingTriggerLabel(i) ? `${n} (${e + 1})` : n;
  }
  _resolveLightingRuleName(t, e) {
    const i = String(t.name || "").trim();
    return this._isPlaceholderRuleName(i) ? this._autoLightingRuleName(t, e) : i;
  }
  _sanitizeDuskDawnLightTargets(t) {
    const e = [], i = /* @__PURE__ */ new Set();
    if (Array.isArray(t))
      for (const n of t) {
        if (!n || typeof n != "object") continue;
        const o = n, a = typeof o.entity_id == "string" ? o.entity_id.trim() : "";
        if (!a || !a.startsWith("light.") || i.has(a)) continue;
        i.add(a);
        const s = o.power === "off" ? "off" : "on", c = {
          entity_id: a,
          power: s
        }, l = typeof o.already_on_behavior == "string" ? o.already_on_behavior.trim() : "";
        if (l && (c.already_on_behavior = this._normalizeDuskDawnAlreadyOnBehavior(l)), s === "on") {
          this._isDimmableEntity(a) && o.brightness_pct !== null && o.brightness_pct !== void 0 && (c.brightness_pct = this._clampBrightnessPct(o.brightness_pct, 30));
          const d = this._normalizeColorHex(o.color_hex);
          d && this._isColorCapableEntity(a) && (c.color_hex = d);
        }
        e.push(c);
      }
    return e;
  }
  _sanitizeDuskDawnBlock(t, e, i) {
    const n = t && typeof t == "object" ? t : {}, o = n.trigger_mode, a = this._normalizeDuskDawnTriggerMode(o), s = this._normalizeDuskDawnBlockId(n.id, e), c = this._normalizeLegacyDuskDawnRuleName(n.name, i), l = this._normalizeDuskDawnStartTime(n.start_time, "18:00"), d = this._normalizeDuskDawnStartTime(n.end_time, "23:59"), u = {
      id: s,
      name: c,
      start_time: l,
      end_time: d,
      time_condition_enabled: !!n.time_condition_enabled,
      trigger_mode: a,
      ambient_condition: this._normalizeDuskDawnAmbientCondition(n.ambient_condition, a),
      must_be_occupied: this._normalizeDuskDawnMustBeOccupied(n.must_be_occupied, o),
      already_on_behavior: this._normalizeDuskDawnAlreadyOnBehavior(n.already_on_behavior),
      light_targets: this._sanitizeDuskDawnLightTargets(n.light_targets)
    };
    return this._applyTriggerDerivedBlockConstraints(u);
  }
  _sanitizeDuskDawnBlocks(t) {
    if (!Array.isArray(t)) return [];
    const e = [], i = /* @__PURE__ */ new Set();
    for (let n = 0; n < t.length; n += 1) {
      const o = t[n];
      if (!o || typeof o != "object") continue;
      const a = o, s = this._normalizeDuskDawnBlockId(a.id, `rule_${n + 1}`);
      i.has(s) || (i.add(s), e.push(this._sanitizeDuskDawnBlock(a, s, e.length)));
    }
    return e;
  }
  _getDuskDawnConfig() {
    var i, n;
    const t = this._duskDawnDefaults(), e = ((n = (i = this.location) == null ? void 0 : i.modules) == null ? void 0 : n.dusk_dawn) || {};
    return Number(e.version) !== 3 ? t : {
      version: 3,
      blocks: this._sanitizeDuskDawnBlocks(e.blocks)
    };
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
          for (const s of i) {
            const c = typeof (s == null ? void 0 : s.id) == "string" ? s.id : void 0, l = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0;
            c && l && n.set(c, l);
          }
        const o = {}, a = {};
        if (Array.isArray(e))
          for (const s of e) {
            const c = typeof (s == null ? void 0 : s.entity_id) == "string" ? s.entity_id : void 0;
            if (!c) continue;
            const l = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0, d = typeof (s == null ? void 0 : s.device_id) == "string" ? n.get(s.device_id) : void 0;
            o[c] = l || d || null, a[c] = {
              hiddenBy: typeof (s == null ? void 0 : s.hidden_by) == "string" ? s.hidden_by : null,
              disabledBy: typeof (s == null ? void 0 : s.disabled_by) == "string" ? s.disabled_by : null,
              entityCategory: typeof (s == null ? void 0 : s.entity_category) == "string" ? s.entity_category : null
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
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, n = this._getLockState(), o = this._getOccupancyState(), a = this._resolveOccupiedState(o), s = a === !0, c = a === !0 ? "Occupied" : a === !1 ? "Vacant" : "Unknown", l = this._resolveVacancyReason(o, a), d = this._resolveOccupiedReason(o, a), u = s ? d : l, p = o ? this._resolveVacantAt(o.attributes || {}, s) : void 0, _ = s ? this._formatVacantAtLabel(p) : void 0, g = this._ambientSourceMethod(this._ambientReading) === "inherited_sensor" ? " (inherited)" : "", m = this._loadingAmbientReading ? "Ambient: loading..." : this._ambientReadingError ? "Ambient: unavailable" : `Ambient: ${this._formatAmbientLux(this._ambientReading)}${g}`;
    return f`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${s ? "occupied" : "vacant"}"
                data-testid="header-occupancy-status"
                .title=${u || ""}
              >
                ${c}
              </span>
              ${n.isLocked ? f`
                    <span class="status-chip locked" data-testid="header-lock-status">Locked</span>
                  ` : f`
                    <span class="header-lock-state" data-testid="header-lock-status">Unlocked</span>
                  `}
              <span class="header-ambient" data-testid="header-ambient-lux">
                ${m}
              </span>
              ${s ? f`
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
    return e && ((o = (n = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : n[e]) != null && o.icon) ? this.hass.areas[e].icon : Sn(t);
  }
  _renderTabs() {
    return f`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => this._handleTabChange("detection")}
        >
          Detection
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
  _renderContent() {
    const t = this._effectiveTab();
    return f`
      <div class="tab-content">
        ${t === "detection" ? f`${this._renderDetectionDraftToolbar()} ${this._renderOccupancyTab()} ${this._renderAdvancedTab()}` : t === "ambient" ? this._renderAmbientTab() : t === "lighting" ? this._renderDeviceAutomationTab("lighting") : t === "media" ? this._renderDeviceAutomationTab("media") : t === "hvac" ? this._renderDeviceAutomationTab("hvac") : ""}
      </div>
    `;
  }
  _effectiveTab() {
    return this._activeTab;
  }
  _hasUnsavedDrafts() {
    return !!(this._occupancyDraftDirty || this._ambientDraftDirty || this._actionRulesDraftDirty);
  }
  _handleTabChange(t) {
    if (this._activeTab !== t) {
      if (this._activeTab === "detection" && this._occupancyDraftDirty) {
        if (!window.confirm(
          "Detection changes are not saved. Discard changes and continue?"
        )) return;
        this._discardDetectionDraft(!1);
      }
      if (this._activeTab === "ambient" && this._ambientDraftDirty) {
        if (!window.confirm(
          "Ambient changes are not saved. Discard changes and continue?"
        )) return;
        this._discardAmbientDraft(!1);
      }
      this._activeTab = t, this.requestUpdate();
    }
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "ambient") return "ambient";
    if (t === "lighting") return "lighting";
    if (t === "appliances") return "hvac";
    if (t === "media") return "media";
    if (t === "hvac") return "hvac";
    if (t === "dusk_dawn") return "lighting";
    if (t === "occupancy") return "detection";
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("beforeunload", this._beforeUnloadHandler), this._startClockTicker(), this._subscribeAutomationStateChanged();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("beforeunload", this._beforeUnloadHandler), this._stopClockTicker(), this._resetSourceDraftState(), this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0);
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
    var t, e;
    if (this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), !!((e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents))
      try {
        this._unsubAutomationStateChanged = await this.hass.connection.subscribeEvents(
          (i) => {
            var l, d, u, p;
            const n = (l = i == null ? void 0 : i.data) == null ? void 0 : l.entity_id, o = (d = i == null ? void 0 : i.data) == null ? void 0 : d.new_state, a = (u = i == null ? void 0 : i.data) == null ? void 0 : u.old_state, s = (o == null ? void 0 : o.attributes) || {}, c = (a == null ? void 0 : a.attributes) || {};
            if (typeof n == "string" && n.startsWith("binary_sensor.")) {
              const _ = typeof s.location_id == "string" ? s.location_id : void 0, h = typeof c.location_id == "string" ? c.location_id : void 0, g = _ || h, m = s.device_class === "occupancy", v = c.device_class === "occupancy";
              if (g && (m || v)) {
                if (o && m)
                  this._liveOccupancyStateByLocation = {
                    ...this._liveOccupancyStateByLocation,
                    [g]: o
                  };
                else {
                  const { [g]: k, ...$ } = this._liveOccupancyStateByLocation;
                  this._liveOccupancyStateByLocation = $;
                }
                ((p = this.location) == null ? void 0 : p.id) === g && this.requestUpdate();
              }
            }
            typeof n == "string" && this._isAmbientStateChangeRelevant(n, o, a) && this._scheduleAmbientReadingReload(), !(typeof n != "string" || !n.startsWith("automation.")) && this._scheduleActionRulesReload();
          },
          "state_changed"
        );
      } catch {
      }
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this._getOccupancyConfig(), e = this._isFloorLocation(), i = !!this.location.ha_area_id, n = this._isSiblingAreaSourceScope(), o = (t.occupancy_sources || []).length, a = this._getLockState();
    return e ? f`
        <div>
          <div class="card-section">
            <div class="section-title">
              <ha-icon .icon=${"mdi:layers"}></ha-icon>
              Floor Occupancy Behavior
            </div>
            <div class="policy-note">
              Floors do not use direct occupancy sources. Floor occupancy is derived from child areas, so
              add sensors to those areas and use this floor for aggregated automation.
            </div>
            ${o > 0 ? f`
                  <div class="policy-warning">
                    This floor still has ${o} unsupported source${o === 1 ? "" : "s"} in
                    config. Floor sources are unsupported and should be moved to areas.
                  </div>
                ` : ""}
          </div>
          ${this._renderSyncLocationsSection(t)}
        </div>
      ` : f`
      <div>
        <div class="card-section">
          ${a.isLocked ? f`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${a.lockedBy.length ? f`Held by ${a.lockedBy.join(", ")}.` : f`Occupancy is currently held by a lock.`}
              </div>
              ${a.lockModes.length ? f`
                    <div class="runtime-note">
                      Modes: ${a.lockModes.map((s) => this._lockModeLabel(s)).join(", ")}
                    </div>
                  ` : ""}
              ${a.directLocks.length ? f`
                    <div class="lock-directive-list">
                      ${a.directLocks.map((s) => f`
                        <div class="lock-directive">
                          <span class="lock-pill">${s.sourceId}</span>
                          <span>${this._lockModeLabel(s.mode)}</span>
                          <span>${this._lockScopeLabel(s.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : f`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="sources-heading">
            <div class="section-title">Sources</div>
            <div class="sources-inline-help">
              ${i ? "Select sensors in this area." : "Integration-owned location: choose sources from Home Assistant entities."}
            </div>
          </div>
          ${i ? "" : f`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="external-source-section">
            <div class="subsection-title">Add Source</div>
            <div class="subsection-help">
              ${i ? n ? "Need more coverage? Add a source from a sibling area or include all compatible entities from this area." : "Need more coverage? Add a source from another area or include all compatible entities from this area." : "Add a source from any HA area (including unassigned entities)."}
            </div>
            ${this._renderExternalSourceComposer(t)}
          </div>
        </div>
        ${this._renderSyncLocationsSection(t)}
      </div>
    `;
  }
  _renderAmbientTab() {
    return this.location ? f`<div>${this._renderAmbientSection()}</div>` : "";
  }
  _renderAdvancedTab() {
    if (!this.location) return "";
    const t = this._getOccupancyConfig();
    return f`
      <div>
        ${this._renderWiabSection(t)}
        ${this._renderAdjacencyAdvancedSection(t)}
        ${this._isManagedShadowHost() ? this._renderManagedShadowAreaSection() : ""}
        ${this._renderRecentOccupancyEventsSection(t)}
      </div>
    `;
  }
  _renderRecentOccupancyEventsSection(t) {
    const e = this._occupancyContributions(t);
    if (e.length === 0) return "";
    const i = this._showRecentOccupancyEvents ? e : e.slice(0, 1);
    return f`
      <div class="card-section" data-testid="recent-occupancy-events-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:clock-outline"}></ha-icon>
          Recent Occupancy Events
        </div>
        <div
          class="sources-inline-help"
          style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; gap: 8px;"
        >
          Sources currently contributing to occupancy.
          ${e.length > 1 ? f`
                <button
                  class="button button-secondary"
                  type="button"
                  style="padding: 2px 8px; font-size: 11px;"
                  data-testid="recent-events-toggle"
                  @click=${() => {
      this._showRecentOccupancyEvents = !this._showRecentOccupancyEvents, this.requestUpdate();
    }}
                >
                  ${this._showRecentOccupancyEvents ? "Show less" : "Show all"}
                </button>
              ` : ""}
        </div>
        <div class="occupancy-events">
          ${i.map(
      (n) => f`
              <div class="occupancy-event">
                <span class="occupancy-event-source">${n.sourceLabel}</span>
                <span class="occupancy-event-meta">${n.stateLabel}</span>
                ${n.relativeTime ? f`<span class="occupancy-event-meta">${n.relativeTime}</span>` : ""}
              </div>
            `
    )}
        </div>
      </div>
    `;
  }
  _isAmbientStateChangeRelevant(t, e, i) {
    var d, u, p, _, h;
    if (!this.location) return !1;
    const n = this._getAmbientConfig(), o = String(((d = this._ambientReading) == null ? void 0 : d.source_sensor) || "").trim(), a = String(n.lux_sensor || "").trim(), s = String(((u = this._ambientReading) == null ? void 0 : u.fallback_method) || "").toLowerCase(), c = !!n.fallback_to_sun || s.includes("sun");
    if (t === "sun.sun" && c) return !0;
    if (!t.startsWith("sensor.")) return !1;
    const l = e || i || ((_ = (p = this.hass) == null ? void 0 : p.states) == null ? void 0 : _[t]);
    if (!this._isLuxSensorEntityForState(t, l)) return !1;
    if (t === o || t === a || (this.location.entity_ids || []).includes(t)) return !0;
    if (this.location.ha_area_id) {
      const g = this._entityAreaById[t], m = (h = l == null ? void 0 : l.attributes) == null ? void 0 : h.area_id;
      if ((g !== void 0 ? g : typeof m == "string" ? m : null) === this.location.ha_area_id) return !0;
    }
    return !1;
  }
  _renderAmbientSection() {
    if (!this.location) return "";
    const t = this._getAmbientConfig(), e = this._ambientReading, i = this._ambientSensorCandidates(), n = this._ambientSourceMethod(e), o = this._ambientSourceMethodLabel(n), a = (e == null ? void 0 : e.source_sensor) || "-", s = typeof (e == null ? void 0 : e.source_location) == "string" && e.source_location ? this._locationName(e.source_location) : "-", c = typeof (e == null ? void 0 : e.is_dark) == "boolean" ? e.is_dark ? "Yes" : "No" : "-", l = typeof (e == null ? void 0 : e.is_bright) == "boolean" ? e.is_bright ? "Yes" : "No" : "-", d = Math.max(0, Number(t.dark_threshold) || 0), u = Math.max(d + 1, Number(t.bright_threshold) || d + 1), p = typeof t.lux_sensor == "string" && t.lux_sensor.trim() ? t.lux_sensor.trim() : "", _ = this._savingAmbientConfig, h = this._ambientDraftDirty;
    return f`
      <div class="card-section" data-testid="ambient-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${"mdi:weather-sunny"}></ha-icon>
            Ambient
          </div>
          <div class="section-title-actions">
            <button
              class="button button-secondary"
              type="button"
              data-testid="ambient-discard-button"
              ?disabled=${_ || !h}
              @click=${() => this._discardAmbientDraft()}
            >
              Discard
            </button>
            <button
              class="dusk-save-button ${h ? "dirty" : ""}"
              type="button"
              data-testid="ambient-save-button"
              ?disabled=${_ || !h}
              @click=${() => this._saveAmbientDraft()}
            >
              ${_ ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        ${this._ambientReadingError ? f`
              <div class="policy-warning" data-testid="ambient-error">${this._ambientReadingError}</div>
            ` : ""}
        ${this._ambientSaveError ? f`
              <div class="policy-warning" data-testid="ambient-save-error">${this._ambientSaveError}</div>
            ` : ""}

        <div class="ambient-grid">
          <div class="ambient-key">Lux level</div>
          <div class="ambient-value" data-testid="ambient-lux-level">${this._formatAmbientLux(e)}</div>
          <div class="ambient-key">Is dark</div>
          <div class="ambient-value" data-testid="ambient-is-dark">${c}</div>
          <div class="ambient-key">Is bright</div>
          <div class="ambient-value" data-testid="ambient-is-bright">${l}</div>
          <div class="ambient-key">Source method</div>
          <div class="ambient-value" data-testid="ambient-source-method">${o}</div>
          <div class="ambient-key">Source sensor</div>
          <div class="ambient-value" data-testid="ambient-source-sensor">${a}</div>
          <div class="ambient-key">Source location</div>
          <div class="ambient-value" data-testid="ambient-source-location">${s}</div>
        </div>

        <div class="policy-note" style="margin-bottom: 8px;">
          Lux sensor assignment is explicit. Set a location sensor or inherit from parent.
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Lux sensor</div>
            <div class="config-help">Choose a mapped illuminance sensor for this location.</div>
          </div>
          <div class="config-value">
            <select
              .value=${p}
              ?disabled=${_}
              data-testid="ambient-lux-sensor-select"
              @change=${(g) => {
      const m = g.target.value.trim();
      this._setAmbientDraft({
        ...t,
        lux_sensor: m || null
      }), this._scheduleAmbientReadingReload();
    }}
            >
              <option value="">Use inherited/default sensor</option>
              ${i.map((g) => f`<option value=${g}>${this._entityName(g)}</option>`)}
            </select>
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Inherit from parent</div>
            <div class="config-help">Use ancestor ambient sensor if this location has no direct sensor.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.inherit_from_parent}
              ?disabled=${_}
              data-testid="ambient-inherit-toggle"
              @change=${(g) => {
      this._setAmbientDraft({
        ...t,
        inherit_from_parent: g.target.checked
      }), this._scheduleAmbientReadingReload();
    }}
            />
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
              .value=${String(d)}
              ?disabled=${_}
              data-testid="ambient-dark-threshold"
              @change=${(g) => {
      const m = Math.max(0, Number(g.target.value) || 0);
      this._setAmbientDraft({
        ...t,
        dark_threshold: m,
        bright_threshold: Math.max(m + 1, Number(t.bright_threshold) || m + 1)
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
              min=${String(d + 1)}
              step="1"
              class="input"
              .value=${String(u)}
              ?disabled=${_}
              data-testid="ambient-bright-threshold"
              @change=${(g) => {
      const m = Math.max(
        d + 1,
        Number(g.target.value) || d + 1
      );
      this._setAmbientDraft({
        ...t,
        bright_threshold: m
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
              @change=${(g) => {
      this._setAmbientDraft({
        ...t,
        fallback_to_sun: g.target.checked
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
              @change=${(g) => {
      this._setAmbientDraft({
        ...t,
        assume_dark_on_error: g.target.checked
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
    const t = P(this.location);
    return t === "floor" || t === "building" || t === "grounds";
  }
  _currentManagedShadowAreaId() {
    return !this._isManagedShadowHost() || !this.location ? "" : ao(this.location);
  }
  _managedShadowAreaById(t) {
    return (this.allLocations || []).find((e) => e.id === t);
  }
  _managedShadowAreaLabel(t) {
    var n, o, a;
    const e = this._managedShadowAreaById(t);
    return e ? (e.ha_area_id ? (a = (o = (n = this.hass) == null ? void 0 : n.areas) == null ? void 0 : o[e.ha_area_id]) == null ? void 0 : a.name : void 0) || e.name : t;
  }
  _renderManagedShadowAreaSection() {
    var p;
    if (!this._isManagedShadowHost() || !this.location) return "";
    const t = this.location.id, e = this._currentManagedShadowAreaId(), i = e ? this._managedShadowAreaById(e) : void 0, n = ((p = i == null ? void 0 : i.modules) == null ? void 0 : p._meta) || {}, o = String(n.role || "").trim().toLowerCase() === "managed_shadow", a = String(n.shadow_for_location_id || "").trim(), s = !!(i && i.ha_area_id && i.parent_id === t && o && a === t), c = e ? this._managedShadowAreaLabel(e) : "Not configured", l = [];
    e && !i && l.push("configured system area was not found"), i && !i.ha_area_id && l.push("location is missing linked HA area id"), i && i.parent_id !== t && l.push(`parent mismatch (expected ${t}, got ${i.parent_id || "root"})`), i && !o && l.push('missing role tag "managed_shadow"'), i && a !== t && l.push(
      `shadow host mapping mismatch (expected ${t}, got ${a || "unset"})`
    );
    const d = l.length ? l.join("; ") : "metadata mismatch", u = !e || !s;
    return f`
      <div class="card-section" data-testid="managed-shadow-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Managed System Area
        </div>
        <div class="policy-note">
          Topomation owns this mapping. Assignments to this ${P(this.location)} are
          remapped to a managed shadow HA area for native area_id interoperability.
        </div>
        <div class="subsection-help">
          Current system area: ${c}
        </div>
        ${e ? "" : f`
              <div class="policy-warning" data-testid="managed-shadow-warning">
                Missing managed system area mapping for ${t}. Action: run Sync Import to create and
                relink the managed system area.
              </div>
            `}
        ${e && !s ? f`
              <div class="policy-warning" data-testid="managed-shadow-warning">
                Managed system area mapping is inconsistent for ${t}: ${d}. Action:
                run Sync Import to reconcile metadata.
              </div>
            ` : ""}
        ${u ? f`
              <div class="advanced-toggle-row">
                <button
                  class="button button-secondary"
                  type="button"
                  data-testid="managed-shadow-sync-import"
                  ?disabled=${this._syncImportInProgress}
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
    if (!this.location || P(this.location) !== "area") return null;
    const t = this.location.parent_id ?? null;
    if (!t) return null;
    const e = (this.allLocations || []).find((i) => i.id === t);
    return !e || P(e) !== "floor" ? null : t;
  }
  _linkedLocationCandidates() {
    if (!this.location) return [];
    const t = this._linkedLocationFloorParentId();
    if (!t) return [];
    const e = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((i) => i.id !== this.location.id).filter((i) => (i.parent_id ?? null) === t).filter((i) => P(i) === "area").filter((i) => !this._isManagedShadowLocation(i, e)).sort((i, n) => i.name.localeCompare(n.name));
  }
  _locationById(t) {
    if (t)
      return (this.allLocations || []).find((e) => e.id === t);
  }
  _syncLocationScope() {
    if (!this.location) return null;
    const t = P(this.location), e = this.location.parent_id ?? null, i = this._locationById(e);
    if (!e || !i) return null;
    const n = P(i);
    return t === "area" && (n === "area" || n === "floor" || n === "building") ? { candidateType: "area", parentId: e, parentType: n } : t === "floor" && n === "building" ? { candidateType: "floor", parentId: e, parentType: n } : null;
  }
  _syncIneligibleMessage() {
    if (!this.location) return "Sync Locations is unavailable for this selection.";
    const t = P(this.location);
    return t === "area" ? "Sync Locations is available for area locations whose parent is an area, floor, or building." : t === "floor" ? "Sync Locations is available for floor locations that are siblings under the same building." : "Sync Locations is available only for eligible area/floor sibling sets.";
  }
  _syncLocationCandidates() {
    if (!this.location) return [];
    const t = this._syncLocationScope();
    if (!t) return [];
    const e = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((i) => i.id !== this.location.id).filter((i) => (i.parent_id ?? null) === t.parentId).filter((i) => P(i) === t.candidateType).filter(
      (i) => t.candidateType !== "area" || !this._isManagedShadowLocation(i, e)
    ).sort((i, n) => i.name.localeCompare(n.name));
  }
  _isManagedShadowLocation(t, e) {
    return Ee(t, e);
  }
  _managedShadowLocationIds() {
    return Ae(this.allLocations || []);
  }
  _normalizeLinkedLocationIds(t, e, i) {
    if (!Array.isArray(t))
      return [];
    const n = /* @__PURE__ */ new Set(), o = [];
    for (const a of t) {
      if (typeof a != "string") continue;
      const s = a.trim();
      !s || n.has(s) || i && s === i || e && !e.has(s) || (n.add(s), o.push(s));
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
  _syncLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._syncLocationCandidates().map((n) => n.id));
    if (e.size === 0)
      return [];
    const i = t.sync_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _candidateLinkedLocationIds(t) {
    const e = this._occupancyConfigForLocation(t).linked_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _candidateSyncLocationIds(t) {
    const e = this._occupancyConfigForLocation(t).sync_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _isTwoWayLinked(t, e) {
    return !this.location || !e.has(t.id) ? !1 : this._candidateLinkedLocationIds(t).includes(this.location.id);
  }
  _toggleLinkedLocation(t, e) {
    const i = this._getOccupancyConfig(), n = new Set(this._linkedLocationIds(i));
    e ? n.add(t) : n.delete(t);
    const o = [...n].sort(
      (a, s) => this._locationName(a).localeCompare(this._locationName(s))
    );
    this._setOccupancyDraft({
      ...i,
      linked_locations: o
    });
  }
  _toggleSyncLocation(t, e) {
    if (!this.location) return;
    const i = this.location.id, n = this._getOccupancyConfig(), o = new Set(this._syncLocationIds(n)), a = new Set(this._candidateSyncLocationIds(t));
    e ? (o.add(t.id), a.add(i)) : (o.delete(t.id), a.delete(i));
    const s = [...o].sort(
      (l, d) => this._locationName(l).localeCompare(this._locationName(d))
    ), c = [...a].sort(
      (l, d) => this._locationName(l).localeCompare(this._locationName(d))
    );
    this._setOccupancyDraft({
      ...n,
      sync_locations: s
    }), this._setPendingOccupancyForLocation(t.id, {
      ...this._occupancyConfigForLocation(t),
      sync_locations: c
    });
  }
  _toggleTwoWayLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this._getOccupancyConfig(), n = new Set(this._linkedLocationIds(i));
    let o = [...n].sort(
      (c, l) => this._locationName(c).localeCompare(this._locationName(l))
    );
    e && !n.has(t.id) && (n.add(t.id), o = [...n].sort(
      (c, l) => this._locationName(c).localeCompare(this._locationName(l))
    ));
    const a = new Set(this._candidateLinkedLocationIds(t));
    e ? a.add(this.location.id) : a.delete(this.location.id);
    const s = [...a].sort(
      (c, l) => this._locationName(c).localeCompare(this._locationName(l))
    );
    this._setOccupancyDraft({
      ...i,
      linked_locations: o
    }), this._setPendingOccupancyForLocation(t.id, {
      ...this._occupancyConfigForLocation(t),
      linked_locations: s
    });
  }
  _renderSyncLocationsSection(t) {
    if (!this.location) return "";
    const e = this._syncLocationScope();
    if (!e)
      return f`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
            Sync Locations
          </div>
          <div class="subsection-help">
            ${this._syncIneligibleMessage()}
          </div>
        </div>
      `;
    const i = this._syncLocationCandidates(), n = this._syncLocationIds(t), o = new Set(n), a = n.length ? n.map((s) => this._locationName(s)).join(", ") : "None";
    return f`
      <div class="card-section" data-testid="sync-locations-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Sync Locations
        </div>
        <div class="subsection-help">
          <strong>Recommended:</strong> synced locations share the same occupancy state and timeout.
          Any occupancy change in one synced location is mirrored to all others.
        </div>
        <div class="linked-location-meta">Synced with: ${a}</div>
        ${i.length === 0 ? f`
              <div class="adjacency-empty">
                ${e.candidateType === "floor" ? "No eligible sibling floors found under this building." : `No eligible sibling areas found under this ${e.parentType}.`}
              </div>
            ` : f`
              <div class="linked-location-list">
                ${i.map((s) => {
      const c = o.has(s.id);
      return f`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`sync-location-${s.id}`}
                          .checked=${c}
                          @change=${(l) => {
        const d = l.target;
        this._toggleSyncLocation(s, d.checked);
      }}
                        />
                        <span class="linked-location-name">${s.name}</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderLinkedLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return f`
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
    const i = this._linkedLocationCandidates(), n = this._linkedLocationIds(t), o = new Set(this._syncLocationIds(t)), a = new Set(n), s = n.length ? n.map((c) => this._locationName(c)).join(", ") : "None";
    return f`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Directional Contributors
        </div>
        <div class="subsection-help">
          Advanced: select locations that can contribute occupancy to this location directionally.
          Configure reverse direction from the other location if needed.
        </div>
        <div class="linked-location-meta">Contributors: ${s}</div>
        ${i.length === 0 ? f`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : f`
              <div class="linked-location-list">
                ${i.map((c) => {
      const l = a.has(c.id), d = o.has(c.id), u = this._isTwoWayLinked(c, a);
      return f`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-${c.id}`}
                          .checked=${l}
                          ?disabled=${d}
                          @change=${(p) => {
        const _ = p.target;
        this._toggleLinkedLocation(c.id, _.checked);
      }}
                        />
                        <span class="linked-location-name">${c.name}</span>
                      </label>
                      <label class="linked-location-right">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-two-way-${c.id}`}
                          .checked=${u}
                          ?disabled=${!l || d}
                          @change=${(p) => {
        const _ = p.target;
        this._toggleTwoWayLinkedLocation(c, _.checked);
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
  _renderAdjacencyAdvancedSection(t) {
    const e = this._showAdvancedAdjacency;
    return f`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:beaker-outline"}></ha-icon>
          Advanced Occupancy Relationships
        </div>
        <div class="subsection-help">
          Directional contributors and movement handoff are advanced tools.
          Most homes should start with Sync Locations.
        </div>
        <div class="advanced-toggle-row">
          <button
            class="button button-secondary"
            data-testid="adjacency-advanced-toggle"
            @click=${() => {
      this._showAdvancedAdjacency = !this._showAdvancedAdjacency;
    }}
          >
            ${e ? "Hide Advanced Controls" : "Show Advanced Controls"}
          </button>
        </div>
      </div>
      ${e ? f`${this._renderLinkedLocationsSection(t)} ${this._renderAdjacencySection()} ${this._renderHandoffTraceSection()}` : ""}
    `;
  }
  _adjacencyCandidates() {
    if (!this.location) return [];
    const t = P(this.location);
    if (t !== "area" && t !== "subarea")
      return [];
    const e = this.location.parent_id ?? null, i = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((n) => n.id !== this.location.id).filter((n) => (n.parent_id ?? null) === e).filter((n) => !this._isManagedShadowLocation(n, i)).filter((n) => {
      const o = P(n);
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
    return f`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:graph-outline"}></ha-icon>
          Adjacent Locations
        </div>
        <div class="subsection-help">
          Model pathways between neighboring locations so wasp-in-box handoffs can reason about movement.
        </div>

        ${e.length === 0 ? f`<div class="adjacency-empty">No adjacency edges for this location yet.</div>` : f`
              <div class="adjacency-list">
                ${e.map((s) => f`
                  <div class="adjacency-row">
                    <div class="adjacency-row-head">
                      <div class="adjacency-neighbor">${this._adjacentLocationName(s)}</div>
                      <button
                        class="button button-secondary adjacency-delete-btn"
                        ?disabled=${this._savingAdjacency}
                        @click=${() => this._handleAdjacencyDelete(s.edge_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div class="adjacency-meta">
                      ${this._edgeDirectionLabel(s)} • ${s.boundary_type} •
                      handoff ${s.handoff_window_sec}s • priority ${s.priority}
                    </div>
                    ${Array.isArray(s.crossing_sources) && s.crossing_sources.length > 0 ? f`
                          <div class="adjacency-meta">
                            crossings: ${s.crossing_sources.join(", ")}
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
                @change=${(s) => {
      const c = s.target;
      this._adjacencyNeighborId = c.value;
    }}
              >
                ${t.map((s) => f`
                  <option value=${s.id}>${s.name}</option>
                `)}
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-direction">Direction</label>
              <select
                id="adjacency-direction"
                .value=${this._adjacencyDirection}
                ?disabled=${this._savingAdjacency}
                @change=${(s) => {
      const c = s.target;
      this._adjacencyDirection = c.value;
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
                @change=${(s) => {
      const c = s.target;
      this._adjacencyBoundaryType = c.value;
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
                @input=${(s) => {
      const c = s.target, l = Number.parseInt(c.value || "12", 10);
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
                @input=${(s) => {
      const c = s.target, l = Number.parseInt(c.value || "50", 10);
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
              @input=${(s) => {
      const c = s.target;
      this._adjacencyCrossingSources = c.value;
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
    return f`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:swap-horizontal-bold"}></ha-icon>
          Handoff Trace
        </div>
        <div class="subsection-help">
          Recent adjacency handoff triggers touching this location. Use this to validate wasp-in-box
          movement assumptions and crossing-source tuning.
        </div>
        ${t.length === 0 ? f`<div class="adjacency-empty">No recent handoff traces for this location.</div>` : f`
              <div class="handoff-trace-list">
                ${t.map((e) => {
      const i = this._parseDateValue(e.timestamp), n = i ? this._formatDateTime(i) : e.timestamp, o = `${this._locationName(e.from_location_id)} -> ${this._locationName(e.to_location_id)}`, a = e.trigger_entity_id || e.trigger_source_id || "unknown";
      return f`
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
    const e = this._getOccupancyState(), i = this._resolveOccupiedState(e);
    if (!e && i === void 0)
      return f`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? f`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const n = (e == null ? void 0 : e.attributes) || {}, o = i === !0, a = this._resolveVacantAt(n, o), s = i === !0 ? "Occupied" : i === !1 ? "Vacant" : "Unknown", c = o ? this._formatVacantAtLabel(a) : "-";
    return f`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${o ? "occupied" : "vacant"}">${s}</span>
          ${t.isLocked ? f`<span class="status-chip locked">Locked</span>` : f`<span class="header-lock-state">Unlocked</span>`}
        </div>
        <div class="runtime-summary-grid">
          <div class="runtime-summary-key">Vacant at</div>
          <div class="runtime-summary-value" data-testid="runtime-vacant-at">${c}</div>
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
    var a, s;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (typeof n.brightness == "number") return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var a, s;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (n.rgb_color || n.hs_color || n.xy_color) return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), n = /* @__PURE__ */ new Map();
    i.forEach((g, m) => n.set(this._sourceKeyFromSource(g), m));
    const o = new Set(this.location.entity_ids || []);
    if (this.location.ha_area_id)
      for (const g of this._entitiesForArea(this.location.ha_area_id))
        o.add(g);
    const c = [...o].sort(
      (g, m) => this._entityName(g).localeCompare(this._entityName(m))
    ).filter((g) => this._isCoreAreaSourceEntity(g)).flatMap(
      (g) => this._candidateItemsForEntity(g)
    ), l = c, d = new Set(c.map((g) => g.key)), u = i.filter((g) => !d.has(this._sourceKeyFromSource(g))).map((g) => ({
      key: this._sourceKeyFromSource(g),
      entityId: g.entity_id,
      signalKey: this._normalizedSignalKeyForSource(g)
    })), p = [...l, ...u].sort((g, m) => {
      const v = n.has(g.key), k = n.has(m.key);
      if (v !== k) return v ? -1 : 1;
      const $ = this._entityName(g.entityId).localeCompare(this._entityName(m.entityId));
      return $ !== 0 ? $ : this._signalSortWeight(g.signalKey) - this._signalSortWeight(m.signalKey);
    }), _ = [], h = /* @__PURE__ */ new Map();
    for (const g of p) {
      const m = this._sourceCardGroupKey(g), v = h.get(m);
      if (v) {
        v.items.push(g);
        continue;
      }
      const k = { key: m, items: [g] };
      h.set(m, k), _.push(k);
    }
    return _.length ? f`
      <div class="candidate-list">
        ${Qe(_, (g) => g.key, (g) => {
      if (this._isIntegratedLightGroup(g.items))
        return this._renderIntegratedLightCard(t, g.items, i, n);
      if (this._isIntegratedMediaGroup(g.items))
        return this._renderIntegratedMediaCard(t, g.items, i, n);
      const m = g.items.some((v) => n.has(v.key));
      return f`
            <div class="source-card ${m ? "enabled" : ""}">
              ${Qe(g.items, (v) => v.key, (v, k) => {
        const $ = n.get(v.key), b = $ !== void 0, R = b ? i[$] : void 0, T = b && R ? R : void 0, I = this._modeOptionsForEntity(v.entityId);
        return f`
                  <div class=${`source-card-item${k > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${b}
                          @change=${(F) => {
          const O = F.target.checked;
          O && !b ? this._addSourceWithDefaults(v.entityId, t, {
            resetExternalPicker: !1,
            signalKey: v.signalKey
          }) || this.requestUpdate() : !O && b && this._removeSource($, t);
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
                            ${b && T && I.length > 1 ? f`
                                  <div class="inline-mode-group">
                                    <span class="inline-mode-label">Mode</span>
                                    <select
                                      class="inline-mode-select"
                                      .value=${I.some((F) => F.value === T.mode) ? T.mode : I[0].value}
                                      @change=${(F) => {
          const O = F.target.value, A = this.hass.states[v.entityId], B = He(T, O, A);
          this._updateSourceDraft(t, $, { ...B, entity_id: T.entity_id });
        }}
                                    >
                                      ${I.map((F) => f`<option value=${F.value}>${F.label}</option>`)}
                                    </select>
                                  </div>
                                ` : ""}
                          </div>
                        </div>
                        ${(this._isMediaEntity(v.entityId) || v.entityId.startsWith("light.")) && v.signalKey ? f`<div class="candidate-submeta">Activity trigger: ${this._mediaSignalLabel(v.signalKey)}</div>` : ""}
                      </div>
                    </div>
                    ${b && R ? this._renderSourceEditor(t, R, $) : ""}
                  </div>
                `;
      })}
            </div>
          `;
    })}
      </div>
    ` : f`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? f`No occupancy-relevant entities found yet. Add one from another area to get started.` : f`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderIntegratedLightCard(t, e, i, n) {
    var _;
    const o = (_ = e[0]) == null ? void 0 : _.entityId;
    if (!o) return "";
    const a = [...e].filter((h) => this._isLightSignalKey(h.signalKey)).sort((h, g) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(g.signalKey));
    if (a.length === 0) return "";
    const s = a.filter((h) => n.has(h.key)), c = s.length > 0, l = s.find((h) => h.signalKey === "power") || s[0] || a[0], d = n.get(l.key), u = d !== void 0 ? i[d] : void 0, p = this._modeOptionsForEntity(o);
    return f`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include light source"
                .checked=${c}
                @change=${(h) => {
      var m;
      const g = h.target.checked;
      if (g && !c) {
        const v = ((m = a.find(($) => $.signalKey === "power")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !g && c && this._removeSourcesByKey(
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
                  ${u && d !== void 0 && p.length > 1 ? f`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === u.mode) ? u.mode : p[0].value}
                            @change=${(h) => {
      const g = h.target.value, m = this.hass.states[o], v = He(u, g, m);
      this._updateSourceDraft(t, d, {
        ...v,
        entity_id: u.entity_id
      });
    }}
                          >
                            ${p.map((h) => f`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const g = n.has(h.key);
      return f`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${g}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !g) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && g && this._removeSourcesByKey([h.key], t);
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
    const a = [...e].filter((h) => this._isMediaSignalKey(h.signalKey)).sort((h, g) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(g.signalKey));
    if (a.length === 0) return "";
    const s = a.filter((h) => n.has(h.key)), c = s.length > 0, l = s.find((h) => h.signalKey === "playback") || s[0] || a[0], d = n.get(l.key), u = d !== void 0 ? i[d] : void 0, p = this._modeOptionsForEntity(o);
    return f`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include media source"
                .checked=${c}
                @change=${(h) => {
      var m;
      const g = h.target.checked;
      if (g && !c) {
        const v = ((m = a.find(($) => $.signalKey === "playback")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !g && c && this._removeSourcesByKey(
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
                  ${u && d !== void 0 && p.length > 1 ? f`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === u.mode) ? u.mode : p[0].value}
                            @change=${(h) => {
      const g = h.target.value, m = this.hass.states[o], v = He(u, g, m);
      this._updateSourceDraft(t, d, {
        ...v,
        entity_id: u.entity_id
      });
    }}
                          >
                            ${p.map((h) => f`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const g = n.has(h.key);
      return f`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${g}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !g) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && g && this._removeSourcesByKey([h.key], t);
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
    var h, g;
    const e = this._availableSourceAreas(), i = this._isSiblingAreaSourceScope(), n = ((h = this.location) == null ? void 0 : h.ha_area_id) || "", o = !!n, a = this._externalAreaId || "", s = a ? a === "__this_area__" ? n ? this._entitiesForArea(n) : [] : this._entitiesForArea(a) : [], c = this._externalEntityId || "", l = new Set(this._workingSources(t).map((m) => this._sourceKeyFromSource(m))), d = c ? this._defaultSignalKeyForEntity(c) : void 0, u = c ? this._sourceKey(c, d) : "", p = i ? "Sibling Area" : (g = this.location) != null && g.ha_area_id ? "Other Area" : "Source Area", _ = i ? "Select sibling area..." : "Select area...";
    return f`
      <div class="external-composer">
        ${i ? f`<div class="runtime-note">Sibling areas on this floor are available, plus all compatible entities in this area.</div>` : ""}
        ${i && e.length === 0 ? f`
              <div class="policy-warning">
                No sibling HA-backed areas are available for cross-area sources.
              </div>
            ` : ""}
        <div class="editor-field">
          <label for="external-source-area">${p}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${a}
            @change=${(m) => {
      const v = m.target.value;
      this._externalAreaId = v, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">${_}</option>
            ${o ? f`<option value="__this_area__">This area (all compatible)</option>` : ""}
            ${i ? "" : f`<option value="__all__">Any area / unassigned</option>`}
            ${e.map((m) => f`<option value=${m.area_id}>${m.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${c}
            @change=${(m) => {
      this._externalEntityId = m.target.value, this.requestUpdate();
    }}
            ?disabled=${!a}
          >
            <option value="">Select sensor...</option>
            ${s.map((m) => f`
              <option
                value=${m}
                ?disabled=${l.has(this._sourceKey(m, this._defaultSignalKeyForEntity(m)))}
              >
                ${this._entityName(m)}${l.has(this._sourceKey(m, this._defaultSignalKeyForEntity(m))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingOccupancyDraft || !c || (u ? l.has(u) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(c, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(c)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderWiabSection(t) {
    var d, u, p, _;
    const e = this._getWiabConfig(t), i = this._wiabInteriorCandidates(), n = this._wiabDoorCandidates(), o = ((d = this.location) == null ? void 0 : d.ha_area_id) || "", a = o ? ((_ = (p = (u = this.hass) == null ? void 0 : u.areas) == null ? void 0 : p[o]) == null ? void 0 : _.name) || o : "", s = !!o && !this._wiabShowAllEntities, c = e.preset || "off";
    return f`
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
              .value=${c}
              @change=${(h) => {
      const g = this._normalizeWiabPreset(
        h.target.value
      ), m = this._defaultWiabTimeouts(g);
      this._setOccupancyDraft({
        ...t,
        wiab: {
          ...e,
          preset: g,
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

          ${c === "off" ? f`<div class="policy-note">WIAB is disabled for this location.</div>` : f`<div class="policy-note">Active preset: ${c === "enclosed_room" ? "Enclosed Room (Door Latch)" : c === "home_containment" ? "Home Containment" : c === "hybrid" ? "Hybrid" : "Off"}</div>`}

          ${c === "off" ? "" : f`
                ${o ? f`
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
                        ${s ? `Showing ${a} entities by default.` : "Showing entities from all areas."}
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

                ${c === "enclosed_room" || c === "hybrid" ? this._renderWiabEntityEditor({
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

                ${c === "home_containment" || c === "hybrid" ? this._renderWiabEntityEditor({
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
      const g = Number(h.target.value);
      this._updateWiabValue(t, "hold_timeout_sec", g);
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
      const g = Number(h.target.value);
      this._updateWiabValue(t, "release_timeout_sec", g);
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
    const i = this._getWiabConfig(t.config)[t.listKey] || [], n = new Set(i), o = t.candidates.filter((s) => !n.has(s)), a = n.has(t.selectedEntityId) ? "" : t.selectedEntityId;
    return f`
      <div class="wiab-entity-editor">
        <label>${t.label}</label>
        <div class="wiab-entity-input">
          <select
            data-testid=${`${t.testIdPrefix}-select`}
            .value=${a}
            @change=${(s) => {
      t.setSelectedEntityId(s.target.value), this.requestUpdate();
    }}
          >
            <option value="">Select entity...</option>
            ${o.map((s) => f`
              <option value=${s}>${this._entityName(s)} (${s})</option>
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

        ${i.length === 0 ? f`<div class="wiab-empty">No entities configured.</div>` : f`
              <div class="wiab-chip-list">
                ${i.map((s) => f`
                  <span class="wiab-chip" data-testid=${`${t.testIdPrefix}-chip`}>
                    ${this._entityName(s)}
                    <button
                      type="button"
                      aria-label="Remove entity"
                      data-testid=${`${t.testIdPrefix}-remove`}
                      @click=${() => this._removeWiabEntity(t.config, t.listKey, s)}
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
    const n = this._getWiabConfig(t), o = n[e] || [], a = o.filter((s) => s !== i);
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
    return (i && !this._wiabShowAllEntities ? this._wiabEntityIdsForArea(i) : Object.keys(e)).filter((s) => this._isCandidateEntity(s)).filter(t).sort((s, c) => this._entityName(s).localeCompare(this._entityName(c)));
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
    var o, a, s;
    const i = ((o = this.hass) == null ? void 0 : o.states) || {}, n = this._entityAreaById[t];
    return n !== void 0 ? n === e : ((s = (a = i[t]) == null ? void 0 : a.attributes) == null ? void 0 : s.area_id) === e;
  }
  _isDoorBoundaryEntity(t) {
    var a, s, c;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory || t.split(".", 1)[0] !== "binary_sensor") return !1;
    const o = String(((c = e.attributes) == null ? void 0 : c.device_class) || "").toLowerCase();
    return ["door", "garage_door", "opening", "window"].includes(o);
  }
  _renderSourceEditor(t, e, i) {
    const n = e, o = this._eventLabelsForSource(e), a = this._sourceKeyFromSource(e), s = this._supportsOffBehavior(e), c = t.default_timeout || 300, l = this._onTimeoutMemory[a], d = n.on_timeout === null ? l ?? c : n.on_timeout ?? l ?? c, u = Math.max(1, Math.min(120, Math.round(d / 60))), p = n.off_trailing ?? 0, _ = Math.max(0, Math.min(120, Math.round(p / 60)));
    return f`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? f`<div class="media-signals">Trigger signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
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
              @change=${(h) => {
      this._updateSourceDraft(t, i, {
        ...n,
        on_event: h.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${o.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(u)}
                ?disabled=${n.on_timeout === null}
                @input=${(h) => {
      const g = Number(h.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: g * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: g * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(u)}
                ?disabled=${n.on_timeout === null}
                @change=${(h) => {
      const g = Math.max(1, Math.min(120, Number(h.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: g * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: g * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${n.on_timeout === null}
                @change=${(h) => {
      const g = h.target.checked, m = this._onTimeoutMemory[a], v = u * 60, k = m ?? v;
      g && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: n.on_timeout ?? k
      }), this._updateSourceDraft(t, i, {
        ...n,
        on_timeout: g ? null : k
      });
    }}
              />
              Indefinite (until ${o.offState})
            </label>
          </div>

          ${s ? f`
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
                    @change=${(h) => {
      this._updateSourceDraft(t, i, {
        ...n,
        off_event: h.target.value
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
                      .value=${String(_)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @input=${(h) => {
      const g = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: g * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(_)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @change=${(h) => {
      const g = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: g * 60 });
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
  _defaultActionAmbientConditionForTrigger(t) {
    return t === "on_dark" ? "dark" : t === "on_bright" ? "bright" : "any";
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
  _serviceLabel(t) {
    const e = String(t || "").trim();
    return e ? e.replace(/[_.]+/g, " ") : "";
  }
  _autoActionRuleName(t, e) {
    const i = this._normalizeActionTriggerType(t.trigger_type);
    let n = this._actionTriggerLabel(i);
    const o = this._actionTargetsForRule(t), a = o[0], s = String((a == null ? void 0 : a.entity_id) || t.action_entity_id || "").trim();
    s && (n = `${n}: ${this._entityName(s)}`, o.length > 1 && (n = `${n} +${o.length - 1}`));
    const c = this._serviceLabel((a == null ? void 0 : a.service) || t.action_service);
    if (c && (n = `${n} (${c})`), t.time_condition_enabled) {
      const l = this._normalizeActionTime(t.start_time, "18:00"), d = this._normalizeActionTime(t.end_time, "23:59");
      n = `${n} ${l}-${d}`;
    }
    return n === this._actionTriggerLabel(i) ? `${n} (${e + 1})` : n;
  }
  _resolveActionRuleName(t, e) {
    const i = String(t.name || "").trim();
    return this._isPlaceholderRuleName(i) ? this._autoActionRuleName(t, e) : i;
  }
  _normalizeActionAmbientCondition(t, e) {
    const i = this._lockedActionAmbientConditionForTrigger(e);
    if (i !== void 0)
      return i;
    const n = String(t || "").trim().toLowerCase();
    return n === "any" || n === "dark" || n === "bright" ? n : this._defaultActionAmbientConditionForTrigger(e);
  }
  _normalizeActionMustBeOccupied(t, e) {
    const i = this._lockedActionMustBeOccupiedForTrigger(e);
    return i !== void 0 ? i : !!t;
  }
  _normalizeActionTargets(t, e) {
    if (!Array.isArray(t)) return [];
    const i = [], n = /* @__PURE__ */ new Set();
    for (const o of t) {
      if (!o || typeof o != "object" || Array.isArray(o)) continue;
      const a = String(o.entity_id || "").trim();
      if (!a || n.has(a)) continue;
      const c = String(o.service || "").trim() || this._defaultActionServiceForTrigger(a, e), l = this._normalizeActionDataForRule(
        o.data,
        a,
        c
      );
      i.push({
        entity_id: a,
        service: c,
        ...l ? { data: l } : {}
      }), n.add(a);
    }
    return i;
  }
  _actionTargetsForRule(t) {
    const e = this._normalizeActionTriggerType(t.trigger_type), i = this._normalizeActionTargets(
      t.actions,
      e
    );
    if (i.length > 0)
      return i;
    const n = String(t.action_entity_id || "").trim();
    if (!n) return [];
    const a = String(t.action_service || "").trim() || this._defaultActionServiceForTrigger(n, e), s = this._normalizeActionDataForRule(t.action_data, n, a);
    return [
      {
        entity_id: n,
        service: a,
        ...s ? { data: s } : {}
      }
    ];
  }
  _setActionTargetsForRule(t, e) {
    const i = this._normalizeActionTriggerType(t.trigger_type), n = this._normalizeActionTargets(e, i), o = n[0];
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
  _normalizeActionBrightnessPct(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) && i > 0 ? Math.max(1, Math.min(100, Math.round(i))) : Math.max(1, Math.min(100, Math.round(e)));
  }
  _normalizeActionDataForRule(t, e, i) {
    if (!t || typeof t != "object" || Array.isArray(t))
      return;
    const n = String(e || "").trim(), o = String(i || "").trim(), a = { ...t };
    delete a.entity_id;
    const s = n.startsWith("light.") && this._isDimmableEntity(n) && o === "turn_on";
    Object.prototype.hasOwnProperty.call(a, "brightness_pct") && (s ? a.brightness_pct = this._normalizeActionBrightnessPct(a.brightness_pct, 30) : delete a.brightness_pct);
    for (const [c, l] of Object.entries(a))
      (l == null || l === "") && delete a[c];
    return Object.keys(a).length > 0 ? a : void 0;
  }
  _actionServiceOptionsForRule(t, e) {
    const i = String(t || "").trim();
    if (!i) return [];
    const n = i.split(".", 1)[0];
    if (n === "media_player")
      return [
        { value: "turn_on", label: "Power on" },
        { value: "turn_off", label: "Power off" },
        { value: "media_play", label: "Play" },
        { value: "media_play_pause", label: "Play/Pause" },
        { value: "media_pause", label: "Pause" },
        { value: "media_stop", label: "Stop" },
        { value: "volume_up", label: "Volume up" },
        { value: "volume_down", label: "Volume down" }
      ];
    if (n === "fan")
      return [
        { value: "turn_on", label: "Turn on" },
        { value: "turn_off", label: "Turn off" }
      ];
    if (n === "switch")
      return [
        { value: "turn_on", label: "Turn on" },
        { value: "turn_off", label: "Turn off" },
        { value: "toggle", label: "Toggle" }
      ];
    if (n === "light")
      return [
        { value: "turn_on", label: "Turn on" },
        { value: "turn_off", label: "Turn off" },
        { value: "toggle", label: "Toggle" }
      ];
    const o = this._defaultActionServiceForTrigger(i, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" }
    ].sort((a, s) => a.value === o ? -1 : s.value === o ? 1 : 0);
  }
  _actionDomainsForTab(t) {
    return t === "lighting" ? ["light"] : t === "media" ? ["media_player"] : ["fan", "switch"];
  }
  _tabForActionEntity(t) {
    const e = String(t || "").split(".", 1)[0];
    if (e === "light") return "lighting";
    if (e === "media_player") return "media";
    if (e === "switch" || e === "fan") return "hvac";
  }
  _isActionRuleEntity(t, e) {
    var o, a;
    if (!((a = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : a[t])) return !1;
    const n = t.split(".", 1)[0];
    return e ? this._actionDomainsForTab(e).includes(n) : n === "light" || n === "switch" || n === "media_player" || n === "fan";
  }
  _actionRuleTargetEntities(t) {
    if (!this.location) return [];
    const e = /* @__PURE__ */ new Set();
    for (const i of this.location.entity_ids || [])
      this._isActionRuleEntity(i, t) && e.add(i);
    if (this.location.ha_area_id)
      for (const i of this._entitiesForArea(this.location.ha_area_id))
        this._isActionRuleEntity(i, t) && e.add(i);
    return [...e].sort((i, n) => this._entityName(i).localeCompare(this._entityName(n)));
  }
  _normalizeActionRule(t, e) {
    const i = this._normalizeActionTriggerType(t.trigger_type), n = typeof t.id == "string" && t.id.trim().length > 0 ? t.id : `action_rule_${e + 1}`, a = this._actionTargetsForRule(t), s = a[0], c = s == null ? void 0 : s.entity_id, l = s == null ? void 0 : s.service, d = s == null ? void 0 : s.data, u = this._normalizeRuleUuid(t.rule_uuid, n);
    return {
      id: n,
      entity_id: typeof t.entity_id == "string" && t.entity_id.trim().length > 0 ? t.entity_id : `automation.${n}`,
      name: typeof t.name == "string" && t.name.trim().length > 0 ? t.name.trim() : `Rule ${e + 1}`,
      rule_uuid: u,
      trigger_type: i,
      actions: a,
      action_entity_id: c || void 0,
      action_service: l || void 0,
      action_data: d,
      ambient_condition: this._normalizeActionAmbientCondition(
        t.ambient_condition,
        i
      ),
      must_be_occupied: this._normalizeActionMustBeOccupied(t.must_be_occupied, i),
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: this._normalizeActionTime(t.start_time, "18:00"),
      end_time: this._normalizeActionTime(t.end_time, "23:59"),
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
  _legacyLightingRulesFromDuskDawn(t = 0) {
    const e = this._getDuskDawnConfig(), i = this._sanitizeDuskDawnBlocks(e.blocks);
    if (i.length === 0) return [];
    const n = [];
    return i.forEach((o, a) => {
      const s = this._normalizeDuskDawnTriggerMode(o.trigger_mode), c = this._normalizeDuskDawnAmbientCondition(
        o.ambient_condition,
        s
      ), l = this._normalizeDuskDawnBlockId(o.id, `rule_${a + 1}`), d = this._sanitizeDuskDawnLightTargets(o.light_targets), u = this._resolveLightingRuleName(o, a);
      if (d.length === 0) {
        const h = `legacy_lighting_${l}`;
        n.push(
          this._normalizeActionRule(
            {
              id: h,
              entity_id: `automation.${h}`,
              name: u,
              rule_uuid: this._normalizeRuleUuid(`legacy_${l}`),
              trigger_type: s,
              ambient_condition: c,
              must_be_occupied: !!o.must_be_occupied,
              time_condition_enabled: !!o.time_condition_enabled,
              start_time: this._normalizeActionTime(o.start_time, "18:00"),
              end_time: this._normalizeActionTime(o.end_time, "23:59"),
              enabled: !0
            },
            t + n.length
          )
        );
        return;
      }
      const p = `legacy_lighting_${l}`, _ = d.map((h) => {
        const g = String(h.entity_id || "").trim();
        if (!g) return;
        const m = h.power === "off" ? "turn_off" : "turn_on", v = m === "turn_on" ? this._normalizeActionDataForRule(
          {
            ...h.brightness_pct ? { brightness_pct: h.brightness_pct } : {},
            ...h.color_hex ? { color_hex: h.color_hex } : {}
          },
          g,
          m
        ) : void 0;
        return {
          entity_id: g,
          service: m,
          ...v ? { data: v } : {}
        };
      }).filter((h) => !!h);
      n.push(
        this._normalizeActionRule(
          {
            id: p,
            entity_id: `automation.${p}`,
            name: u,
            rule_uuid: this._normalizeRuleUuid(`legacy_${l}`),
            trigger_type: s,
            actions: _,
            ambient_condition: c,
            must_be_occupied: !!o.must_be_occupied,
            time_condition_enabled: !!o.time_condition_enabled,
            start_time: this._normalizeActionTime(o.start_time, "18:00"),
            end_time: this._normalizeActionTime(o.end_time, "23:59"),
            enabled: !0
          },
          t + n.length
        )
      );
    }), n;
  }
  _resetActionRulesDraftFromLoaded() {
    let t = this._actionRules.map(
      (n, o) => this._normalizeActionRule(n, o)
    );
    const e = t.some(
      (n) => this._tabForActionEntity(String(n.action_entity_id || "").trim()) === "lighting"
    ), i = /* @__PURE__ */ new Set();
    if (!e) {
      const n = this._legacyLightingRulesFromDuskDawn(t.length);
      if (n.length > 0) {
        for (const o of n)
          i.add(String(o.id || ""));
        t = [...t, ...n];
      }
    }
    this._actionRulesDraft = t, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {};
    for (const n of t) {
      const o = String(n.id || "");
      let a = this._tabForActionEntity(String(n.action_entity_id || "").trim());
      !a && i.has(o) && (a = "lighting"), o && a && (this._actionRuleTabById[o] = a);
    }
  }
  _setActionRulesDraft(t) {
    const e = t.map((o, a) => this._normalizeActionRule(o, a)), i = new Set(e.map((o) => String(o.id || ""))), n = {};
    for (const [o, a] of Object.entries(this._actionRuleTabById))
      i.has(o) && (n[o] = a);
    for (const o of e) {
      const a = String(o.id || ""), s = this._tabForActionEntity(String(o.action_entity_id || "").trim());
      a && s && (n[a] = s);
    }
    this._actionRuleTabById = n, this._actionRulesDraft = e, this._actionRulesDraftDirty = this._computeActionRulesDraftDirty(e), this._actionRulesSaveError = void 0, this.requestUpdate();
  }
  _actionRuleLookup(t) {
    const e = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
    return t.forEach((n, o) => {
      const a = this._normalizeActionRule(n, o), s = String(a.id || "").trim();
      s && e.set(s, a);
      const c = this._normalizeRuleUuid(a.rule_uuid, s);
      c && i.set(c, a);
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
      data: this._normalizeActionDataForRule(o.data, o.entity_id, o.service) || {}
    }));
    return JSON.stringify({
      name: this._resolveActionRuleName(i, e),
      trigger_type: this._normalizeActionTriggerType(i.trigger_type),
      actions: n,
      ambient_condition: this._normalizeActionAmbientCondition(i.ambient_condition, i.trigger_type),
      must_be_occupied: !!i.must_be_occupied,
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
    const e = t.map((a, s) => this._normalizeActionRule(a, s)), i = this._actionRules.map(
      (a, s) => this._normalizeActionRule(a, s)
    );
    if (e.length !== i.length)
      return !0;
    const n = this._actionRuleLookup(i), o = /* @__PURE__ */ new Set();
    for (const [a, s] of e.entries()) {
      const c = this._persistedActionRuleForDraft(s, i);
      if (!c || (o.add(String(c.id || "")), this._isActionRuleDirty(s, a, c)))
        return !0;
      const l = this._normalizeRuleUuid(s.rule_uuid, s.id);
      if (l && !n.byRuleUuid.has(l))
        return !0;
    }
    return o.size !== i.length;
  }
  _rebuildActionRulesDraftAfterSync(t, e, i = {}) {
    const n = t.map((l, d) => this._normalizeActionRule(l, d)), o = this._actionRuleLookup(n), a = [...n], s = i.ruleIds || /* @__PURE__ */ new Set(), c = i.ruleUuids || /* @__PURE__ */ new Set();
    for (const [l, d] of e.entries()) {
      const u = this._normalizeActionRule(d, l), p = String(u.id || "").trim(), _ = this._normalizeRuleUuid(u.rule_uuid, p);
      if (s.has(p) || c.has(_))
        continue;
      const h = (p ? o.byId.get(p) : void 0) || (_ ? o.byRuleUuid.get(_) : void 0);
      if (!h) {
        a.push(u);
        continue;
      }
      const g = a.findIndex((m) => String(m.id || "") === String(h.id || ""));
      g < 0 || this._isActionRuleDirty(u, g, h) && (a[g] = this._normalizeActionRule(
        {
          ...u,
          id: h.id,
          entity_id: h.entity_id,
          rule_uuid: h.rule_uuid
        },
        g
      ));
    }
    this._actionRules = n, this._setActionRulesDraft(a);
  }
  _addActionRule(t) {
    const e = this._workingActionRules(), n = this._actionRuleTargetEntities(t)[0] || "", o = t === "lighting" ? "on_dark" : "on_occupied", a = `action_rule_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    this._actionRuleTabById[a] = t;
    const s = {
      id: a,
      entity_id: "",
      name: `Rule ${e.length + 1}`,
      rule_uuid: this._generateRuleUuid(),
      trigger_type: o,
      actions: n ? [
        {
          entity_id: n,
          service: this._defaultActionServiceForTrigger(n, o)
        }
      ] : [],
      action_entity_id: n || void 0,
      action_service: this._defaultActionServiceForTrigger(n, o),
      ambient_condition: this._defaultActionAmbientConditionForTrigger(o),
      must_be_occupied: this._normalizeActionMustBeOccupied(!1, o),
      time_condition_enabled: !1,
      start_time: "18:00",
      end_time: "23:59",
      enabled: !0
    };
    this._setActionRulesDraft([...e, s]);
  }
  _updateActionRule(t, e) {
    const i = this._workingActionRules().map((n, o) => {
      if (n.id !== t) return this._normalizeActionRule(n, o);
      const a = {
        ...n,
        ...e
      };
      let s = this._actionTargetsForRule(a);
      if (Object.prototype.hasOwnProperty.call(e, "trigger_type")) {
        const l = this._normalizeActionTriggerType(e.trigger_type);
        a.trigger_type = l, Object.prototype.hasOwnProperty.call(e, "ambient_condition") || (a.ambient_condition = this._normalizeActionAmbientCondition(
          a.ambient_condition,
          l
        )), Object.prototype.hasOwnProperty.call(e, "must_be_occupied") || (a.must_be_occupied = this._normalizeActionMustBeOccupied(
          a.must_be_occupied,
          l
        )), !Object.prototype.hasOwnProperty.call(e, "action_service") && !Object.prototype.hasOwnProperty.call(e, "actions") && (s = s.map((d) => {
          const u = this._defaultActionServiceForTrigger(d.entity_id, l), p = this._normalizeActionDataForRule(
            d.data,
            d.entity_id,
            u
          );
          return {
            entity_id: d.entity_id,
            service: u,
            ...p ? { data: p } : {}
          };
        }));
      }
      if (Object.prototype.hasOwnProperty.call(e, "actions") && (s = this._normalizeActionTargets(
        e.actions,
        this._normalizeActionTriggerType(a.trigger_type)
      )), Object.prototype.hasOwnProperty.call(e, "action_entity_id")) {
        const l = String(e.action_entity_id || "").trim();
        if (!l)
          s = [];
        else if (s.length === 0) {
          const d = this._defaultActionServiceForTrigger(
            l,
            this._normalizeActionTriggerType(a.trigger_type)
          );
          s = [{ entity_id: l, service: d }];
        } else {
          const d = { ...s[0], entity_id: l };
          Object.prototype.hasOwnProperty.call(e, "action_service") || (d.service = this._defaultActionServiceForTrigger(
            l,
            this._normalizeActionTriggerType(a.trigger_type)
          )), d.data = this._normalizeActionDataForRule(
            d.data,
            d.entity_id,
            d.service
          ), s = [
            {
              entity_id: d.entity_id,
              service: d.service,
              ...d.data ? { data: d.data } : {}
            },
            ...s.slice(1)
          ];
        }
      }
      if (Object.prototype.hasOwnProperty.call(e, "action_service")) {
        const l = String(e.action_service || "").trim();
        if (s.length === 0) {
          const d = String(a.action_entity_id || "").trim();
          d && l && (s = [
            {
              entity_id: d,
              service: l
            }
          ]);
        } else {
          const d = s[0], u = this._normalizeActionDataForRule(
            Object.prototype.hasOwnProperty.call(e, "action_data") ? e.action_data : d.data,
            d.entity_id,
            l
          );
          s = [
            {
              entity_id: d.entity_id,
              service: l,
              ...u ? { data: u } : {}
            },
            ...s.slice(1)
          ];
        }
      }
      if (Object.prototype.hasOwnProperty.call(e, "action_data") && !Object.prototype.hasOwnProperty.call(e, "action_service") && s.length > 0) {
        const l = s[0], d = this._normalizeActionDataForRule(
          e.action_data,
          l.entity_id,
          l.service
        );
        s = [
          {
            entity_id: l.entity_id,
            service: l.service,
            ...d ? { data: d } : {}
          },
          ...s.slice(1)
        ];
      }
      const c = this._setActionTargetsForRule(a, s);
      return a.actions = c.actions, a.action_entity_id = c.action_entity_id, a.action_service = c.action_service, a.action_data = c.action_data, this._normalizeActionRule(a, o);
    });
    this._setActionRulesDraft(i);
  }
  _removeActionRule(t) {
    const e = this._workingActionRules().filter((i) => i.id !== t);
    this._setActionRulesDraft(e);
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
      var c;
      const a = ((c = n.name) == null ? void 0 : c.trim()) || `Rule ${o + 1}`, s = this._actionTargetsForRule(n);
      s.length === 0 && e.push(`${a}: select at least one target device.`), s.some((l) => !l.service) && e.push(`${a}: select an action service for each target.`), n.time_condition_enabled && (i.test(String(n.start_time || "")) || e.push(`${a}: begin time must be HH:MM.`), i.test(String(n.end_time || "")) || e.push(`${a}: end time must be HH:MM.`));
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
      const i = await Mt(
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
        ), g = h ? String(h.id || "") : void 0, m = await Hi(
          this.hass,
          {
            location: this.location,
            name: u.name || `Rule ${l + 1}`,
            rule_uuid: u.rule_uuid,
            automation_id: g || void 0,
            trigger_type: u.trigger_type,
            actions: p,
            action_entity_id: _.entity_id,
            action_service: _.service,
            action_data: _.data,
            ambient_condition: u.ambient_condition,
            must_be_occupied: !!u.must_be_occupied,
            time_condition_enabled: !!u.time_condition_enabled,
            start_time: u.start_time,
            end_time: u.end_time,
            require_dark: u.ambient_condition === "dark"
          },
          this.entryId
        );
        a.add(String(m.id || ""));
      }
      const s = i.filter((l) => !a.has(String(l.id || ""))).map((l) => Ki(this.hass, l, this.entryId));
      s.length > 0 && await Promise.all(s);
      const c = await Mt(
        this.hass,
        this.location.id,
        this.entryId
      );
      this._actionRules = c, this._resetActionRulesDraftFromLoaded(), this._showToast("Action rules saved", "success");
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
      const s = this._persistedActionRuleForDraft(a);
      s && i.push(this._normalizeActionRule(s, n));
    }
    this._setActionRulesDraft(i), this._showToast("Rule edits discarded", "success");
  }
  async _saveOrUpdateActionRule(t) {
    if (!this.location || !this.hass || this._savingActionRules)
      return;
    const e = this._workingActionRules(), i = e.findIndex((s) => String(s.id || "") === t);
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
      const s = this._actionTargetsForRule(n), c = s[0];
      if (!c)
        throw new Error("Select at least one target device before saving.");
      await Hi(
        this.hass,
        {
          location: this.location,
          name: this._resolveActionRuleName(n, i),
          rule_uuid: n.rule_uuid,
          automation_id: a && String(a.id || "").trim() || void 0,
          trigger_type: n.trigger_type,
          actions: s,
          action_entity_id: c.entity_id,
          action_service: c.service,
          action_data: c.data,
          ambient_condition: n.ambient_condition,
          must_be_occupied: !!n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: n.start_time,
          end_time: n.end_time,
          require_dark: n.ambient_condition === "dark"
        },
        this.entryId
      );
      const l = await Mt(this.hass, this.location.id, this.entryId);
      this._rebuildActionRulesDraftAfterSync(l, e, {
        ruleIds: /* @__PURE__ */ new Set([t]),
        ruleUuids: /* @__PURE__ */ new Set([this._normalizeRuleUuid(n.rule_uuid, t)])
      }), this._showToast(a ? "Rule updated" : "Rule saved", "success");
    } catch (s) {
      this._actionRulesSaveError = (s == null ? void 0 : s.message) || "Failed to save action rule", this._showToast(this._actionRulesSaveError, "error");
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
      const a = await Mt(this.hass, this.location.id, this.entryId);
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
    } : t === "media" ? {
      icon: "mdi:speaker-wireless",
      label: "Media Rules",
      emptyMessage: "No media rules configured yet."
    } : {
      icon: "mdi:fan",
      label: "HVAC Rules",
      emptyMessage: "No HVAC rules configured yet."
    };
  }
  _renderLightingRuleActionRows(t, e, i, n) {
    const o = this._actionTargetsForRule(e), a = new Map(o.map((c) => [c.entity_id, c])), s = [...n];
    for (const c of o)
      s.includes(c.entity_id) || s.unshift(c.entity_id);
    return s.length === 0 ? f`<div class="text-muted">No local lights found for this location.</div>` : f`
      <div class="dusk-light-actions" data-testid=${`action-rule-${t}-actions`}>
        ${s.map((c, l) => {
      const d = a.get(c), u = !!d, p = this._isDimmableEntity(c), _ = this._defaultActionServiceForTrigger(c, e.trigger_type), h = String((d == null ? void 0 : d.service) || _), g = this._normalizeActionDataForRule(d == null ? void 0 : d.data, c, h), m = this._normalizeActionBrightnessPct(
        g == null ? void 0 : g.brightness_pct,
        30
      ), v = u ? h === "turn_off" ? "off" : h === "toggle" ? "toggle" : "on" : _ === "turn_off" ? "off" : "on", k = u && h === "turn_off" ? 0 : m, $ = (R) => {
        const T = o.map((V) => ({ ...V })), I = T.findIndex((V) => V.entity_id === c), F = I >= 0 ? { ...T[I] } : {
          service: _
        }, A = String(R.service ?? F.service ?? "").trim() || _, B = this._normalizeActionDataForRule(
          R.data ?? F.data,
          c,
          A
        ), Z = {
          entity_id: c,
          service: A,
          ...B ? { data: B } : {}
        };
        I >= 0 ? T[I] = Z : T.push(Z), this._updateActionRule(t, { actions: T });
      }, b = () => {
        this._updateActionRule(t, {
          actions: o.filter((R) => R.entity_id !== c)
        });
      };
      return f`
            <div class="dusk-light-action-row" data-testid=${`action-rule-${t}-device-row-${l}`}>
              <div class="dusk-light-action-grid ${u ? "" : "disabled"}">
                <input
                  type="checkbox"
                  class="switch-input"
                  .checked=${u}
                  ?disabled=${i}
                  data-testid=${`action-rule-${t}-device-include-${l}`}
                  @change=${(R) => {
        if (!R.target.checked) {
          if (!u) return;
          b();
          return;
        }
        $({
          service: _,
          data: p && _ === "turn_on" ? {
            brightness_pct: m
          } : {}
        });
      }}
                />
                <div class="dusk-light-entity-meta">
                  <span>${this._entityName(c)}</span>
                  <code>${c}</code>
                </div>
                ${p ? f`
                      <label class="dusk-level-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          class="dusk-level-slider"
                          .value=${String(k)}
                          ?disabled=${i || !u}
                          data-testid=${`action-rule-${t}-device-level-${l}`}
                          @input=${(R) => {
        const T = Number(R.target.value), I = Number.isFinite(T) ? Math.max(0, Math.min(100, Math.round(T))) : m;
        if (I <= 0) {
          $({
            service: "turn_off",
            data: {}
          });
          return;
        }
        $({
          service: "turn_on",
          data: {
            ...g || {},
            brightness_pct: I
          }
        });
      }}
                        />
                        <span class="dusk-level-value">${k}%</span>
                      </label>
                    ` : f`
                      <select
                        .value=${v}
                        ?disabled=${i || !u}
                        data-testid=${`action-rule-${t}-device-action-${l}`}
                        @change=${(R) => {
        const T = String(R.target.value || "on");
        $({
          service: T === "off" ? "turn_off" : T === "toggle" ? "toggle" : "turn_on",
          data: {}
        });
      }}
                      >
                        <option value="on">Turn on</option>
                        <option value="off">Turn off</option>
                        <option value="toggle">Toggle</option>
                      </select>
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
  _renderDeviceAutomationTab(t) {
    if (!this.location) return "";
    const e = this._savingActionRules || this._loadingActionRules, i = this._deviceAutomationTabMeta(t), n = this._rulesForDeviceAutomationTab(t), o = this._actionRuleTargetEntities(t), a = t === "lighting" ? [
      { value: "on_dark", label: "On dark" },
      { value: "on_bright", label: "On bright" },
      { value: "on_occupied", label: "On occupied" },
      { value: "on_vacant", label: "On vacant" }
    ] : [
      { value: "on_occupied", label: "On occupied" },
      { value: "on_vacant", label: "On vacant" }
    ], s = t === "lighting" ? "light" : t === "media" ? "media" : "HVAC or ventilation";
    return f`
      ${t === "lighting" ? "" : this._renderActionStartupConfig(t)}
      <div class="card-section" data-testid="actions-rules-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${i.icon}></ha-icon>
            ${i.label}
          </div>
        </div>
        ${this._actionRulesError ? f`<div class="policy-warning">${this._actionRulesError}</div>` : ""}
        ${this._actionRulesSaveError ? f`<div class="policy-warning">${this._actionRulesSaveError}</div>` : ""}

        <div class="dusk-block-list">
          ${n.length === 0 ? f`
                <div class="text-muted">
                  ${i.emptyMessage}
                  ${o.length === 0 ? f`No compatible ${s} devices found in this location.` : ""}
                </div>
              ` : n.map((c, l) => {
      var O;
      const d = String(c.id || ""), u = this._editingActionRuleNameId === d, p = ((O = c.name) == null ? void 0 : O.trim()) || `Rule ${l + 1}`, _ = this._normalizeActionTriggerType(c.trigger_type), h = String(c.action_entity_id || "").trim();
      this._normalizeActionDataForRule(
        c.action_data,
        h,
        String(c.action_service || "")
      );
      const g = this._isActionAmbientConditionLockedByTrigger(_), m = this._normalizeActionAmbientCondition(
        c.ambient_condition,
        _
      ), v = m === "dark" ? "Must be dark" : m === "bright" ? "Must be bright" : "Ignore ambient", k = this._isActionMustBeOccupiedLockedByTrigger(_), $ = this._normalizeActionMustBeOccupied(
        c.must_be_occupied,
        _
      ), b = $ ? "Must be occupied" : "Must be vacant", R = this._persistedActionRuleForDraft(c), T = !!R, I = this._isActionRuleDirty(c, l, R), F = this._actionServiceOptionsForRule(
        h,
        _
      );
      return f`
                  <div class="dusk-block-row" data-testid=${`action-rule-${d}`}>
                    <div class="dusk-block-head">
                      ${u ? f`
                            <input
                              type="text"
                              class="input dusk-block-title-input"
                              .value=${this._editingActionRuleNameValue}
                              ?disabled=${e}
                              @input=${(A) => {
        this._editingActionRuleNameValue = A.target.value;
      }}
                              @blur=${() => this._commitActionRuleNameEdit(
        d,
        `Rule ${l + 1}`
      )}
                              @keydown=${(A) => {
        A.key === "Enter" ? this._commitActionRuleNameEdit(
          d,
          `Rule ${l + 1}`
        ) : A.key === "Escape" && this._cancelActionRuleNameEdit();
      }}
                            />
                          ` : f`
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

                    <div class="dusk-rule-row">
                      <span class="config-label">Trigger</span>
                      <select
                        class="dusk-wide-select"
                        .value=${c.trigger_type}
                        ?disabled=${e}
                        @change=${(A) => this._updateActionRule(d, {
        trigger_type: this._normalizeActionTriggerType(
          A.target.value
        )
      })}
                      >
                        ${a.map(
        (A) => f`<option value=${A.value}>${A.label}</option>`
      )}
                      </select>
                    </div>

                    <div class="dusk-rule-section-title">Conditions</div>
                    <div class="dusk-conditions">
                      <div class="config-row">
                        <div>
                          <div class="config-label">Ambient must be</div>
                          <div class="config-help">
                            ${g ? "Derived from trigger." : "Optional ambient filter at trigger time."}
                          </div>
                        </div>
                        <div class="config-value">
                          ${g ? f`
                                <div class="dusk-condition-derived">
                                  <span>${v}</span>
                                  <span class="dusk-condition-derived-note">Set by trigger</span>
                                </div>
                              ` : f`
                                <select
                                  class="dusk-wide-select"
                                  .value=${m}
                                  ?disabled=${e}
                                  @change=${(A) => this._updateActionRule(d, {
        ambient_condition: this._normalizeActionAmbientCondition(
          A.target.value,
          _
        )
      })}
                                >
                                  <option value="any">Ignore ambient</option>
                                  <option value="dark">Must be dark</option>
                                  <option value="bright">Must be bright</option>
                                </select>
                              `}
                        </div>
                      </div>

                      <div class="config-row">
                        <div>
                          <div class="config-label">Must be occupied</div>
                          <div class="config-help">
                            ${k ? "Derived from trigger." : "Apply this rule only when the location is occupied at trigger time."}
                          </div>
                        </div>
                        <div class="config-value">
                          ${k ? f`
                                <div class="dusk-condition-derived">
                                  <span>${b}</span>
                                  <span class="dusk-condition-derived-note">Set by trigger</span>
                                </div>
                              ` : f`
                                <input
                                  type="checkbox"
                                  class="switch-input"
                                  .checked=${!!$}
                                  ?disabled=${e}
                                  @change=${(A) => this._updateActionRule(d, {
        must_be_occupied: A.target.checked
      })}
                                />
                              `}
                        </div>
                      </div>

                      <div class="config-row">
                        <div>
                          <div class="config-label">Use time window</div>
                          <div class="config-help">
                            Limit this rule to a time range. Crossing midnight is supported.
                          </div>
                        </div>
                        <div class="config-value">
                          <input
                            type="checkbox"
                            class="switch-input"
                            .checked=${!!c.time_condition_enabled}
                            ?disabled=${e}
                            @change=${(A) => this._updateActionRule(d, {
        time_condition_enabled: A.target.checked
      })}
                          />
                        </div>
                      </div>

                      ${c.time_condition_enabled ? f`
                            <div class="dusk-time-fields" style="margin-top: 8px;">
                              <label class="dusk-time-field">
                                <span class="config-label">Begin</span>
                                <input
                                  type="time"
                                  class="input"
                                  .value=${String(c.start_time || "18:00")}
                                  ?disabled=${e}
                                  @change=${(A) => this._updateActionRule(d, {
        start_time: this._normalizeActionTime(
          A.target.value,
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
                                  .value=${String(c.end_time || "23:59")}
                                  ?disabled=${e}
                                  @change=${(A) => this._updateActionRule(d, {
        end_time: this._normalizeActionTime(
          A.target.value,
          "23:59"
        )
      })}
                                />
                              </label>
                            </div>
                          ` : ""}
                    </div>

                    <div class="dusk-rule-section-title">Actions</div>
                    ${t === "lighting" ? this._renderLightingRuleActionRows(
        d,
        c,
        e,
        o
      ) : f`
                          <div class="dusk-rule-row">
                            <span class="config-label">Device</span>
                            <select
                              class="dusk-wide-select"
                              .value=${h}
                              ?disabled=${e}
                              @change=${(A) => {
        const B = String(A.target.value || "").trim();
        if (!B) {
          this._updateActionRule(d, {
            action_entity_id: void 0,
            action_service: void 0,
            action_data: {}
          });
          return;
        }
        const Z = this._defaultActionServiceForTrigger(
          B,
          c.trigger_type
        );
        this._updateActionRule(d, {
          action_entity_id: B,
          action_service: Z,
          action_data: {}
        });
      }}
                            >
                              <option value="">Select device...</option>
                              ${o.map((A) => f`
                                <option value=${A}>
                                  ${this._entityName(A)} (${A})
                                </option>
                              `)}
                            </select>
                          </div>
                          <div class="dusk-rule-row">
                            <span class="config-label">Action</span>
                            <select
                              class="dusk-wide-select"
                              .value=${c.action_service || ""}
                              ?disabled=${e || !h}
                              @change=${(A) => {
        const B = String(
          A.target.value || ""
        ).trim();
        this._updateActionRule(d, {
          action_service: B,
          action_data: {}
        });
      }}
                            >
                              ${h ? F.map(
        (A) => f`<option value=${A.value}>${A.label}</option>`
      ) : f`<option value="">Select device first...</option>`}
                            </select>
                          </div>
                        `}
                    <div class="dusk-block-footer">
                      ${T ? I ? f`
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
                            ` : f`
                              <button
                                class="button button-secondary dusk-delete-rule-button"
                                type="button"
                                data-testid=${`action-rule-${d}-delete`}
                                ?disabled=${e}
                                @click=${() => this._deleteActionRule(d)}
                              >
                                Delete rule
                              </button>
                            ` : f`
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
                          `}
                    </div>
                  </div>
                `;
    })}
        </div>

        <div class="dusk-list-footer">
          <button
            class="button button-primary"
            data-testid="action-rule-add"
            ?disabled=${e}
            @click=${() => this._addActionRule(t)}
          >
            Add rule
          </button>
        </div>
      </div>
    `;
  }
  _renderActionStartupConfig(t) {
    const e = this._getAutomationConfig(), i = !!e.reapply_last_state_on_startup, n = t === "media" ? "media" : "HVAC", o = t === "media" ? "Reapply media rules on startup" : "Reapply HVAC rules on startup";
    return f`
      <div class="startup-inline">
        <label class="startup-inline-toggle">
          <input
            type="checkbox"
            class="switch-input"
            .checked=${i}
            data-testid=${`startup-reapply-${t}`}
            @change=${(a) => {
      const s = a.target.checked;
      this._updateAutomationConfig({
        ...e,
        reapply_last_state_on_startup: s
      });
    }}
          />
          ${o}
        </label>
        <div class="startup-inline-help">
          Re-runs matching ${n} rules for this location after Home Assistant starts.
        </div>
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
    const a = this._modeOptionsForEntity(o.entity_id).map((c) => c.value), s = this._normalizeSource(
      o.entity_id,
      {
        ...i,
        mode: a.includes(i.mode) ? i.mode : a[0]
      }
    );
    n[e] = s, this._setWorkingSources(t, n);
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
    const i = new Set(t), n = this._workingSources(e), o = n.filter((s) => !i.has(this._sourceKeyFromSource(s)));
    if (o.length === n.length) return;
    const a = { ...this._onTimeoutMemory };
    for (const s of n) {
      const c = this._sourceKeyFromSource(s);
      i.has(c) && delete a[c];
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
    let c = An(a);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const l = this._normalizeSource(t, c);
    return this._setWorkingSources(e, [...n, l]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate()), !0;
  }
  _resetSourceDraftState() {
  }
  _normalizeSource(t, e) {
    var u;
    const i = this._isMediaEntity(t), n = this._isDimmableEntity(t), o = this._isColorCapableEntity(t), a = (u = e.source_id) != null && u.includes("::") ? e.source_id.split("::")[1] : void 0, s = this._defaultSignalKeyForEntity(t), c = e.signal_key || a || s;
    let l;
    (i && (c === "playback" || c === "volume" || c === "mute") || (n || o) && (c === "power" || c === "level" || c === "color")) && (l = c);
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
  _getAutomationConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.automation) || {};
  }
  async _updateAutomationConfig(t) {
    await this._updateModuleConfig("automation", t);
  }
  _availableSourceAreas() {
    var o, a;
    if (this._isSiblingAreaSourceScope())
      return this._siblingSourceAreas();
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = this._managedShadowAreaIdSet(), i = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(i).filter((s) => !!s.area_id).filter((s) => s.area_id !== t).filter((s) => !e.has(s.area_id)).map((s) => ({
      area_id: s.area_id,
      name: s.name || s.area_id
    })).sort((s, c) => s.name.localeCompare(c.name));
  }
  _isSiblingAreaSourceScope() {
    if (!this.location || P(this.location) !== "area" || !this.location.ha_area_id) return !1;
    const t = this.allLocations || [];
    if (t.length === 0) return !1;
    const e = this.location.parent_id ?? null;
    if (!e) return !1;
    const i = t.find((n) => n.id === e);
    return !!i && P(i) === "floor";
  }
  _siblingSourceAreas() {
    if (!this.location || !this._isSiblingAreaSourceScope()) return [];
    const t = this.location.parent_id ?? null;
    if (!t) return [];
    const e = this.location.id, i = /* @__PURE__ */ new Set(), n = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((o) => o.id !== e).filter((o) => (o.parent_id ?? null) === t).filter((o) => P(o) === "area").filter((o) => !this._isManagedShadowLocation(o, n)).filter((o) => !!o.ha_area_id).filter((o) => {
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
      var a, s;
      const o = this._entityAreaById[n];
      return o != null ? o === t : ((s = (a = e[n]) == null ? void 0 : a.attributes) == null ? void 0 : s.area_id) === t;
    }).filter((n) => this._isCandidateEntity(n)).sort((n, o) => this._entityName(n).localeCompare(this._entityName(o)));
  }
  _isCandidateEntity(t) {
    var a, s;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t];
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
      const c = String(n.device_class || "");
      return c ? [
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
      ].includes(c) : !0;
    }
    return !1;
  }
  _isCoreAreaSourceEntity(t) {
    var a, s;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t];
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
      const c = String(n.device_class || "");
      return c ? [
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
      ].includes(c) : !0;
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
  _getOccupancyState() {
    var n;
    if (!this.location) return;
    const t = this.location.id, e = this._liveOccupancyStateByLocation[t];
    if (e)
      return e;
    const i = ((n = this.hass) == null ? void 0 : n.states) || {};
    for (const o of Object.values(i)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if (a.device_class === "occupancy" && a.location_id === this.location.id)
        return o;
    }
  }
  _resolveOccupiedState(t) {
    var n, o;
    const e = (n = this.location) == null ? void 0 : n.id, i = e ? (o = this.occupancyStates) == null ? void 0 : o[e] : void 0;
    if (typeof i == "boolean")
      return i;
    if (t) {
      if (t.state === "on")
        return !0;
      if (t.state === "off")
        return !1;
    }
  }
  _activeContributorsExcluding(t) {
    const e = this._getOccupancyState();
    if (((e == null ? void 0 : e.state) || "").toLowerCase() !== "on") return [];
    const i = (e == null ? void 0 : e.attributes) || {}, n = Array.isArray(i.contributions) ? i.contributions : [];
    if (!n.length) return [];
    const o = String(t || "").trim(), a = n.map((s) => String((s == null ? void 0 : s.source_id) || "").trim()).filter((s) => s.length > 0 && s !== o);
    return Array.from(new Set(a));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, n = e.lock_modes, o = e.direct_locks, a = Array.isArray(i) ? i.map((l) => String(l)) : [], s = Array.isArray(n) ? n.map((l) => String(l)) : [], c = Array.isArray(o) ? o.map((l) => ({
      sourceId: String((l == null ? void 0 : l.source_id) || "unknown"),
      mode: String((l == null ? void 0 : l.mode) || "freeze"),
      scope: String((l == null ? void 0 : l.scope) || "self")
    })).sort(
      (l, d) => `${l.sourceId}:${l.mode}:${l.scope}`.localeCompare(`${d.sourceId}:${d.mode}:${d.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: a,
      lockModes: s,
      directLocks: c
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
    for (const s of n) {
      const c = s == null ? void 0 : s.expires_at;
      if (c == null) {
        o = !0;
        continue;
      }
      const l = this._parseDateValue(c);
      l && (!a || l.getTime() > a.getTime()) && (a = l);
    }
    return o ? null : a;
  }
  _formatVacantAtLabel(t) {
    return t instanceof Date ? this._formatDateTime(t) : "No timeout scheduled";
  }
  _resolveVacancyReason(t, e) {
    var a, s, c, l, d, u;
    if (e !== !1) return;
    const i = (a = this.location) == null ? void 0 : a.id;
    if (!i) return;
    const n = (c = (s = this.occupancyTransitions) == null ? void 0 : s[i]) == null ? void 0 : c.reason;
    if (((d = (l = this.occupancyTransitions) == null ? void 0 : l[i]) == null ? void 0 : d.occupied) === !1) {
      const p = this._formatOccupancyReason(n);
      if (p) return p;
    }
    return this._formatOccupancyReason((u = t == null ? void 0 : t.attributes) == null ? void 0 : u.reason);
  }
  _resolveOccupiedReason(t, e) {
    var l, d, u, p, _, h;
    if (e !== !0) return;
    const i = (l = this.location) == null ? void 0 : l.id;
    if (!i) return;
    const n = (u = (d = this.occupancyTransitions) == null ? void 0 : d[i]) == null ? void 0 : u.reason;
    if (((_ = (p = this.occupancyTransitions) == null ? void 0 : p[i]) == null ? void 0 : _.occupied) === !0) {
      const g = this._formatOccupancyReason(n);
      if (g) return g;
    }
    const a = this._formatOccupancyReason((h = t == null ? void 0 : t.attributes) == null ? void 0 : h.reason);
    if (a) return a;
    const s = this._occupancyContributions(this._getOccupancyConfig(), !0);
    return s.length ? `Contributed by ${s[0].sourceLabel}` : "Active source events detected";
  }
  _formatOccupancyReason(t) {
    if (typeof t != "string") return;
    const e = t.trim();
    if (!e) return;
    const i = e.toLowerCase();
    if (i === "timeout")
      return "Vacated by timeout";
    if (i === "propagation:parent")
      return "Vacated by parent propagation";
    if (i.startsWith("propagation:child:"))
      return "Vacated by child propagation";
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
    const n = i.attributes || {}, o = Array.isArray(n.contributions) ? n.contributions : [], a = this._nowEpochMs, c = [...o.map((d) => {
      const u = typeof (d == null ? void 0 : d.source_id) == "string" && d.source_id ? d.source_id : typeof (d == null ? void 0 : d.source) == "string" && d.source ? d.source : "";
      if (!u) return;
      const p = this._sourceLabelForSourceId(t, u), _ = String((d == null ? void 0 : d.state) || (d == null ? void 0 : d.state_value) || "").trim() || "active", h = this._parseDateValue(d == null ? void 0 : d.updated_at) || this._parseDateValue(d == null ? void 0 : d.changed_at) || this._parseDateValue(d == null ? void 0 : d.last_changed) || this._parseDateValue(d == null ? void 0 : d.timestamp), g = h ? `${this._formatRelativeDuration(h)} ago` : this._isContributionActive(d) ? "active" : "inactive";
      return {
        sourceLabel: p,
        sourceId: u,
        stateLabel: _,
        relativeTime: g,
        _timestampMs: h ? h.getTime() : a + (_ === "active" ? 0 : -1),
        _active: this._isContributionActive(d)
      };
    }).filter(
      (d) => !!d
    )].sort((d, u) => d._active !== u._active ? d._active ? -1 : 1 : u._timestampMs - d._timestampMs);
    return (e ? c.filter((d) => d._active) : c).map(({ sourceLabel: d, stateLabel: u, relativeTime: p, sourceId: _ }) => ({
      sourceLabel: `${d}${d === _ ? "" : ` (${_})`}`,
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
    const i = (t.occupancy_sources || []).find(
      (n) => n.source_id === e || n.entity_id === e
    );
    if (i)
      return this._candidateTitle(
        i.entity_id,
        i.signal_key || this._normalizedSignalKey(i.entity_id, void 0)
      );
    if (e.includes("::")) {
      const [n, o] = e.split("::"), a = this._normalizedSignalKey(n, o), s = (t.occupancy_sources || []).find(
        (c) => c.entity_id === n
      );
      return s ? this._candidateTitle(s.entity_id, s.signal_key || a) : this._candidateTitle(n, a);
    }
    return this._entityName(e);
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
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), a = e % 60, s = [];
    return i > 0 && s.push(`${i}d`), n > 0 && s.push(`${n}h`), o > 0 && s.length < 2 && s.push(`${o}m`), (s.length === 0 || i === 0 && n === 0 && o === 0) && s.push(`${a}s`), s.slice(0, 2).join(" ");
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
    const i = t.mode === "any_change" ? "Any change" : "Specific states", n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0, a = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(n)})` : "ON: ignore", s = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(o)})` : "OFF: ignore";
    return `${i} • ${a} • ${s}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(f`<span class="event-chip">ON -> trigger (${this._formatDuration(n)})</span>`) : i.push(f`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      f`<span class="event-chip off">OFF -> clear (${this._formatDuration(o)})</span>`
    ) : i.push(f`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var a, s;
    const e = (s = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : s[t], i = (e == null ? void 0 : e.attributes) || {}, n = t.split(".", 1)[0], o = String(i.device_class || "");
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
  _eventLabelsForSource(t) {
    var l, d;
    const e = t.entity_id, i = (d = (l = this.hass) == null ? void 0 : l.states) == null ? void 0 : d[e], n = (i == null ? void 0 : i.attributes) || {}, o = e.split(".", 1)[0], a = String(n.device_class || "");
    let s = "ON", c = "OFF";
    return o === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(a) ? (s = "Open", c = "Closed") : o === "binary_sensor" && a === "motion" ? (s = "Motion", c = "No motion") : o === "binary_sensor" && ["presence", "occupancy"].includes(a) ? (s = "Detected", c = "Not detected") : o === "person" || o === "device_tracker" ? (s = "Home", c = "Away") : o === "media_player" ? t.signal_key === "volume" ? (s = "Volume change", c = "No volume change") : t.signal_key === "mute" ? (s = "Mute change", c = "No mute change") : (s = "Playing", c = "Paused/idle") : o === "light" && t.signal_key === "level" ? (s = "Brightness change", c = "No brightness change") : o === "light" && t.signal_key === "color" ? (s = "Color change", c = "No color change") : (o === "light" && t.signal_key === "power" || o === "light" || o === "switch" || o === "fan") && (s = "On", c = "Off"), {
      onState: s,
      offState: c,
      onBehavior: "When activity is detected",
      onTimeout: "Occupied hold time",
      offBehavior: "When activity stops",
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
          const s = this._getOccupancyConfig().default_timeout || 300, c = t.on_timeout === null ? s : t.on_timeout ?? s, l = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: this._serviceDataWithEntryId({
              location_id: this.location.id,
              source_id: l,
              timeout: c
            })
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: l,
                timeout: c
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
          const s = a.slice(0, 2).join(", "), c = a.length > 2 ? ` +${a.length - 2} more` : "";
          this._showToast(`Still occupied by ${s}${c}`, "error");
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
  async _runSyncImport() {
    if (!this._syncImportInProgress) {
      this._syncImportInProgress = !0;
      try {
        const t = await this.hass.callWS(
          this._withEntryId({
            type: "topomation/sync/import",
            force: !0
          })
        ), e = typeof (t == null ? void 0 : t.message) == "string" ? String(t.message) : "Sync import completed";
        this._showToast(e, "success");
      } catch (t) {
        console.error("Failed to run sync import:", t), this._showToast((t == null ? void 0 : t.message) || "Failed to run sync import", "error");
      } finally {
        this._syncImportInProgress = !1;
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
      const c = a.querySelector("input.timeout-slider");
      c && (c.value = String(n));
      const l = a.querySelector("input.input");
      l && (l.value = String(n));
    }
    if (!this.location || this._isFloorLocation()) return;
    const s = this._getOccupancyConfig();
    this._setOccupancyDraft({ ...s, default_timeout: o });
  }
  _isFloorLocation() {
    return !!this.location && P(this.location) === "floor";
  }
};
we.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  allLocations: { attribute: !1 },
  adjacencyEdges: { attribute: !1 },
  entryId: { attribute: !1 },
  entityRegistryRevision: { type: Number },
  forcedTab: { type: String },
  occupancyStates: { attribute: !1 },
  occupancyTransitions: { attribute: !1 },
  handoffTraces: { attribute: !1 }
}, we.styles = [
  $e,
  Jt`
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

      .dusk-section-heading {
        margin-top: 18px;
        margin-bottom: 8px;
      }

      .dusk-rule-section-title {
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
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 114px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .dusk-save-button.dirty {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: var(--primary-background-color, #fff);
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

      .occupancy-events {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
        max-width: 820px;
      }

      .occupancy-event {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 6px 8px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-event-source {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .occupancy-event-meta {
        color: var(--text-secondary-color);
        white-space: nowrap;
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

      .section-title-row {
        max-width: 900px;
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
        max-width: 820px;
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

      .dusk-time-field .input {
        width: 132px;
        min-width: 132px;
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

      .source-card-item.grouped {
        border-top: 1px solid var(--divider-color);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .linked-location-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
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
        max-width: 820px;
      }

      .adjacency-list {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        max-width: 820px;
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
        max-width: 820px;
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
        max-width: 820px;
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

      .external-source-section {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--divider-color);
        max-width: 820px;
      }

      .external-source-section .subsection-title {
        margin-bottom: 4px;
      }

      .external-source-section .subsection-help {
        margin-bottom: 10px;
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

      .wiab-config {
        display: grid;
        gap: 10px;
        max-width: 820px;
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

        .dusk-block-grid {
          grid-template-columns: 1fr;
        }

        .dusk-rule-row {
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

        .sources-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `
];
let ai = we;
if (!customElements.get("ht-location-inspector"))
  try {
    customElements.define("ht-location-inspector", ai);
  } catch (r) {
    console.error("[ht-location-inspector] failed to define element", r);
  }
console.log("[ht-location-dialog] module loaded");
var Ji, Qi;
try {
  (Qi = (Ji = import.meta) == null ? void 0 : Ji.hot) == null || Qi.accept(() => window.location.reload());
} catch {
}
const xe = class xe extends ht {
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
        var s, c;
        return `${a.name}(${(c = (s = a.modules) == null ? void 0 : s._meta) == null ? void 0 : c.type})`;
      })), this.open && !o) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const a = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, s = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (n = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : n.icon : void 0;
          this._config = {
            name: this.location.name,
            type: a.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: s || void 0
          };
        } else {
          const a = this.defaultType ?? "area", s = this.defaultParentId;
          this._config = {
            name: "",
            type: a,
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
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), f`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? f`
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
    const t = this._config.type, e = Xe(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const n = e.filter((s) => s !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: n,
      totalLocations: this.locations.length
    }), n.length === 0) return [];
    const o = this._managedShadowLocationIds(), a = this.locations.filter((s) => {
      if (s.is_explicit_root || this._isManagedShadowLocation(s, o)) return !1;
      const c = P(s);
      return n.includes(c);
    }).map((s) => ({
      value: s.id,
      label: s.name
    }));
    return console.log("[LocationDialog] Valid parents:", a.length, a.map((s) => s.label)), a;
  }
  _isManagedShadowLocation(t, e) {
    return Ee(t, e);
  }
  _managedShadowLocationIds() {
    return Ae(this.locations);
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = Xe(this._config.type);
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
xe.properties = {
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
}, xe.styles = [
  $e,
  Jt`
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
let ri = xe;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", ri);
const qi = "topomation:panel-tree-split", Vi = "topomation:panel-right-mode", qe = 0.4, Ve = 0.25, Ge = 0.75, da = "application/x-topomation-entity-id";
var Zi, tn;
try {
  (tn = (Zi = import.meta) == null ? void 0 : Zi.hot) == null || tn.accept(() => window.location.reload());
} catch {
}
const Se = class Se extends ht {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._occupancyTransitionByLocation = {}, this._adjacencyEdges = [], this._handoffTraceByLocation = {}, this._treePanelSplit = qe, this._isResizingPanels = !1, this._entityAreaById = {}, this._entitySearch = "", this._assignBusyByEntityId = {}, this._rightPanelMode = "inspector", this._assignmentFilter = "all", this._deviceGroupExpanded = {}, this._haRegistryRevision = 0, this._hasLoaded = !1, this._loadSeq = 0, this._entityAreaIndexLoaded = !1, this._entityAreaRevision = 0, this._deviceGroupsCache = [], this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleDeviceSearch = (t) => {
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
      confirm(`Delete "${e.name}"?`) && this._handleLocationDelete(
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
        t.preventDefault(), this._setPanelSplit(Ve, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(Ge, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(qe, !0);
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
    super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, this._loadLocations()), t.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), this._restorePanelSplitPreference(), this._restoreRightPanelModePreference(), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._registryRefreshTimer && (clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
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
      return f`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return f`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (c) => c.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), n = e === "location" ? void 0 : e, o = "Automation", a = this._deleteDisabledReason(t), s = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return f`
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
              ${this._isSplitStackedLayout() ? f`
                    <button
                      class="button button-secondary"
                      @click=${this._handleOpenSidebar}
                      aria-label="Open Home Assistant sidebar"
                    >
                      Sidebar
                    </button>
                  ` : ""}
              ${f`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${a}
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
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
            @entity-dropped=${this._handleEntityDropped}
          ></ht-location-tree>
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(Ve * 100)}
          aria-valuemax=${Math.round(Ge * 100)}
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
            <div class="right-panel-modes" role="tablist" aria-label="Right panel mode">
              <button
                class="workspace-tab ${this._rightPanelMode === "inspector" ? "active" : ""}"
                role="tab"
                aria-selected=${this._rightPanelMode === "inspector"}
                data-testid="right-mode-configure"
                @click=${() => this._handleRightPanelModeChange("inspector")}
              >
                Configure
              </button>
              <button
                class="workspace-tab ${this._rightPanelMode === "assign" ? "active" : ""}"
                role="tab"
                aria-selected=${this._rightPanelMode === "assign"}
                data-testid="right-mode-assign"
                @click=${() => this._handleRightPanelModeChange("assign")}
              >
                Assign Devices
              </button>
            </div>
          </div>
          ${this._rightPanelMode === "assign" ? this._renderDeviceAssignmentPanel(t) : f`
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
                  @source-test=${this._handleSourceTest}
                  @adjacency-changed=${this._handleAdjacencyChanged}
                  @location-meta-changed=${this._handleLocationMetaChanged}
                ></ht-location-inspector>
              `}
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-appliances") ? "hvac" : t.startsWith("/topomation-media") ? "media" : t.startsWith("/topomation-hvac") ? "hvac" : "location";
  }
  _managerView() {
    var e, i, n;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "media" || t === "hvac" ? t : (n = this.route) != null && n.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return {
      title: "Topology",
      subtitle: "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation."
    };
  }
  _renderDialogs() {
    var t, e;
    return f`
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
          const s = this._entityAreaById, c = Object.keys(s), l = Object.keys(a);
          (c.length !== l.length || l.some((u) => s[u] !== a[u])) && (this._entityAreaById = a, this._entityAreaRevision += 1), this._entityAreaIndexLoaded = !0;
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
    return f`
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
        ${e ? f`<div class="device-empty">Loading area mapping…</div>` : ""}

        ${n.length === 0 ? f`<div class="device-empty">No devices match the current filter.</div>` : n.map((s) => this._renderDeviceGroup(s, t == null ? void 0 : t.id))}
      </div>
    `;
  }
  _renderDeviceGroup(t, e) {
    const i = this._isGroupExpanded(t.key);
    return f`
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
        ${i ? t.entities.length === 0 ? f`<div class="device-empty">No devices in this group.</div>` : t.entities.map((n) => {
      const o = !!this._assignBusyByEntityId[n], a = this._entityDisplayName(n);
      return f`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${n}
                  @dragstart=${(s) => this._handleDeviceDragStart(s, n)}
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
    (i = t.dataTransfer) == null || i.setData(da, e), (n = t.dataTransfer) == null || n.setData("text/plain", e), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
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
    const e = P(t);
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
    const a = /* @__PURE__ */ new Map(), s = (u, p, _, h) => {
      const g = a.get(u);
      if (g) return g;
      const m = { key: u, label: p, type: _, locationId: h, entities: [] };
      return a.set(u, m), m;
    };
    s("unassigned", "Unassigned", "unassigned");
    for (const u of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(u)) continue;
      const p = this._entityDisplayName(u), _ = o.get(u), h = _ ? n.get(_) : void 0, g = this._areaLabel(this._effectiveAreaIdForEntity(u));
      if (t && !`${p} ${u} ${(h == null ? void 0 : h.name) || ""} ${g}`.toLowerCase().includes(t))
        continue;
      if (!h) {
        s("unassigned", "Unassigned", "unassigned").entities.push(u);
        continue;
      }
      const m = this._groupTypeForLocation(h);
      s(
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
    const c = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6
    }, l = [...a.values()].filter((u) => u.entities.length > 0 || u.key === "unassigned").sort((u, p) => {
      const _ = c[u.type] - c[p.type];
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
      const c = Array.from(a.values()).filter(
        (l) => !l.is_explicit_root && !this._isManagedShadowLocation(l)
      );
      this._locations = [...c], this._adjacencyEdges = Array.isArray(o.adjacency_edges) ? [...o.adjacency_edges] : [], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._occupancyTransitionByLocation = this._buildOccupancyTransitionsFromStates(), this._locationsVersion += 1, this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((l) => l.id === this._selectedId) || this._isManagedShadowLocation(this._locations.find((l) => l.id === this._selectedId))) && (this._selectedId = this._preferredSelectedLocationId()), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
    } catch (n) {
      console.error("Failed to load locations:", n), this._error = n.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (n == null ? void 0 : n.message) || n);
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
    return f`
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
    return f`
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
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root);
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : "Delete selected location" : "Select a location to delete";
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
        const c = ((a = this._locations.find((l) => l.id === e)) == null ? void 0 : a.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (s) {
        console.error("Failed to toggle lock:", s), this._showToast((s == null ? void 0 : s.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy" || String(o == null ? void 0 : o.location_id) !== String(t)) continue;
      const a = Array.isArray(o == null ? void 0 : o.locked_by) ? o.locked_by.map((s) => String(s)) : [];
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
      const a = this._locations.find((p) => p.id === e), s = (a == null ? void 0 : a.name) || e, { isLocked: c, lockedBy: l } = this._getLocationLockState(e);
      if (c) {
        const p = l.length ? ` (${l.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${s}" is locked${p}.`, "warning");
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
        }), this._logEvent("ui", p, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${s}" as occupied` : `Marked "${s}" as unoccupied (vacated)`,
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
        ), await this._loadLocations(!0), this._locationsVersion += 1, o) {
          const s = (a && this._locations.some((c) => c.id === a) ? a : (n = this._locations[0]) == null ? void 0 : n.id) ?? void 0;
          this._selectedId = s;
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
  _isSplitStackedLayout() {
    return this.narrow ? !0 : typeof window.matchMedia != "function" ? !1 : window.matchMedia("(max-width: 768px)").matches;
  }
  _clampPanelSplit(t) {
    return Number.isFinite(t) ? Math.min(Ge, Math.max(Ve, t)) : qe;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(qi);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(qi, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _restoreRightPanelModePreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Vi);
      (e === "assign" || e === "inspector") && (this._rightPanelMode = e);
    } catch {
    }
    this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
  }
  _persistRightPanelModePreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Vi, this._rightPanelMode);
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
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection) && typeof this.hass.connection.subscribeEvents == "function") {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
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
            var a, s, c, l;
            const e = (a = t == null ? void 0 : t.data) == null ? void 0 : a.location_id, i = (s = t == null ? void 0 : t.data) == null ? void 0 : s.occupied;
            if (!e || typeof i != "boolean") return;
            const n = (c = t == null ? void 0 : t.data) == null ? void 0 : c.previous_occupied, o = typeof ((l = t == null ? void 0 : t.data) == null ? void 0 : l.reason) == "string" && t.data.reason.trim().length ? t.data.reason.trim() : void 0;
            this._setOccupancyState(e, i, {
              previousOccupied: typeof n == "boolean" ? n : void 0,
              reason: o
            }), this._logEvent("ha", "topomation_occupancy_changed", {
              locationId: e,
              occupied: i,
              previousOccupied: typeof n == "boolean" ? n : void 0,
              reason: o
            });
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
      }
      try {
        this._unsubHandoffTrace = await this.hass.connection.subscribeEvents(
          (t) => {
            const e = (t == null ? void 0 : t.data) || {}, i = typeof e.edge_id == "string" && e.edge_id.trim() ? e.edge_id.trim() : "", n = typeof e.from_location_id == "string" && e.from_location_id.trim() ? e.from_location_id.trim() : "", o = typeof e.to_location_id == "string" && e.to_location_id.trim() ? e.to_location_id.trim() : "";
            if (!i || !n || !o) return;
            const a = {
              edge_id: i,
              from_location_id: n,
              to_location_id: o,
              trigger_entity_id: typeof e.trigger_entity_id == "string" ? e.trigger_entity_id : "",
              trigger_source_id: typeof e.trigger_source_id == "string" ? e.trigger_source_id : "",
              boundary_type: typeof e.boundary_type == "string" ? e.boundary_type : "virtual",
              handoff_window_sec: typeof e.handoff_window_sec == "number" ? e.handoff_window_sec : 12,
              status: typeof e.status == "string" ? e.status : "provisional_triggered",
              timestamp: typeof e.timestamp == "string" && e.timestamp.trim() ? e.timestamp : (/* @__PURE__ */ new Date()).toISOString()
            }, s = (l, d, u) => {
              const p = l[d] || [];
              return {
                ...l,
                [d]: [u, ...p].slice(0, 25)
              };
            };
            let c = s(this._handoffTraceByLocation, n, a);
            c = s(c, o, a), this._handoffTraceByLocation = c, this._logEvent("ha", "topomation_handoff_trace", a);
          },
          "topomation_handoff_trace"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_handoff_trace events", t), this._logEvent("error", "subscribe failed: topomation_handoff_trace", String(t));
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
      try {
        this._unsubEntityRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("entity_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "entity_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to entity_registry_updated events", t), this._logEvent("error", "subscribe failed: entity_registry_updated", String(t));
      }
      try {
        this._unsubDeviceRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("device_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "device_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to device_registry_updated events", t), this._logEvent("error", "subscribe failed: device_registry_updated", String(t));
      }
      try {
        this._unsubAreaRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("area_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "area_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to area_registry_updated events", t), this._logEvent("error", "subscribe failed: area_registry_updated", String(t));
      }
      await this._syncStateChangedSubscription();
    }
  }
  _scheduleRegistryRefresh(t, e) {
    this._logEvent("ha", t, e), this._registryRefreshTimer && (window.clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._registryRefreshTimer = window.setTimeout(() => {
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
      const s = o.previous_occupied, c = typeof o.reason == "string" && o.reason.trim().length ? o.reason.trim() : void 0, l = typeof (n == null ? void 0 : n.last_changed) == "string" && n.last_changed.trim().length ? n.last_changed : void 0;
      t[a] = {
        occupied: (n == null ? void 0 : n.state) === "on",
        previousOccupied: typeof s == "boolean" ? s : void 0,
        reason: c,
        changedAt: l
      };
    }
    return t;
  }
  async _syncStateChangedSubscription() {
    var t;
    if ((t = this.hass) != null && t.connection && typeof this.hass.connection.subscribeEvents == "function") {
      if (!this._eventLogOpen) {
        this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
        return;
      }
      if (!this._unsubStateChanged)
        try {
          this._unsubStateChanged = await this.hass.connection.subscribeEvents(
            (e) => {
              var c, l, d, u, p, _;
              const i = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
              if (!i) return;
              const n = (l = e == null ? void 0 : e.data) == null ? void 0 : l.new_state, o = (n == null ? void 0 : n.attributes) || {};
              if (i.startsWith("binary_sensor.") && o.device_class === "occupancy" && o.location_id && this._setOccupancyState(o.location_id, (n == null ? void 0 : n.state) === "on", {
                previousOccupied: typeof o.previous_occupied == "boolean" ? o.previous_occupied : void 0,
                reason: typeof o.reason == "string" && o.reason.trim().length ? o.reason.trim() : void 0,
                changedAt: typeof (n == null ? void 0 : n.last_changed) == "string" && n.last_changed.trim().length ? n.last_changed : void 0
              }), !this._shouldTrackEntity(i)) return;
              const a = (u = (d = e == null ? void 0 : e.data) == null ? void 0 : d.new_state) == null ? void 0 : u.state, s = (_ = (p = e == null ? void 0 : e.data) == null ? void 0 : p.old_state) == null ? void 0 : _.state;
              this._logEvent("ha", "state_changed", { entityId: i, oldState: s, newState: a });
            },
            "state_changed"
          );
        } catch (e) {
          console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
        }
    }
  }
  _renderEventLog() {
    return f`
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
          ${this._eventLogEntries.length === 0 ? f`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => f`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? f`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
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
    var i, n;
    const e = /* @__PURE__ */ new Set();
    for (const o of this._locations) {
      for (const s of o.entity_ids || []) e.add(s);
      const a = ((n = (i = o.modules) == null ? void 0 : i.occupancy) == null ? void 0 : n.occupancy_sources) || [];
      for (const s of a) e.add(s.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, n;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const o of this._locations) {
      if (!e.has(o.id)) continue;
      if ((o.entity_ids || []).includes(t) || (((n = (i = o.modules) == null ? void 0 : i.occupancy) == null ? void 0 : n.occupancy_sources) || []).some((s) => s.entity_id === t)) return !0;
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
    const n = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: t,
      message: e,
      data: i
    };
    this._eventLogEntries = [n, ...this._eventLogEntries].slice(0, 200);
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
    var n, o, a, s;
    const t = (o = (n = this.panel) == null ? void 0 : n.config) == null ? void 0 : o.entry_id;
    if (typeof t == "string" && t.trim()) {
      const c = t.trim();
      return this._lastKnownEntryId = c, c;
    }
    const e = (s = (a = this.route) == null ? void 0 : a.path) == null ? void 0 : s.split("?", 2)[1];
    if (e) {
      const c = new URLSearchParams(e).get("entry_id");
      if (c && c.trim()) {
        const l = c.trim();
        return this._lastKnownEntryId = l, l;
      }
    }
    const i = new URLSearchParams(window.location.search).get("entry_id");
    if (i && i.trim()) {
      const c = i.trim();
      return this._lastKnownEntryId = c, c;
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
    return t ? Ee(t, this._managedShadowLocationIds()) : !1;
  }
  _managedShadowLocationIds() {
    return Ae(this._locations);
  }
  _parentSelectableLocations() {
    return this._locations.filter((t) => !this._isManagedShadowLocation(t));
  }
  _preferredSelectedLocationId() {
    var t;
    return (t = this._locations.find((e) => !this._isManagedShadowLocation(e))) == null ? void 0 : t.id;
  }
};
Se.properties = {
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
  _haRegistryRevision: { state: !0 }
}, Se.styles = [
  $e,
  Jt`
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

      .right-panel-modes {
        margin-top: var(--spacing-sm);
        display: flex;
        gap: var(--spacing-sm);
        border-bottom: 1px solid var(--divider-color);
      }

      .workspace-tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: color var(--transition-speed), border-color var(--transition-speed);
      }

      .workspace-tab:hover {
        color: var(--text-primary-color);
      }

      .workspace-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
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
let si = Se;
if (!customElements.get("topomation-panel"))
  try {
    customElements.define("topomation-panel", si);
  } catch (r) {
    console.error("[topomation-panel] failed to define element", r);
  }
export {
  si as TopomationPanel
};
