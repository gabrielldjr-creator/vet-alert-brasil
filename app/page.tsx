"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    async function load() {
      const snapshot = await getDocs(collection(db, "alerts"));
      snapshot.forEach((doc) => {
        console.log(doc.id, doc.data());
      });
    }

    load();
  }, []);

  return <div>Vet Alert Brasil</div>;
}
