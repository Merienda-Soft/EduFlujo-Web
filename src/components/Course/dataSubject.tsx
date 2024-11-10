export interface Subject {
    name: string;
  }
  
  export interface Curriculum {
    grade: string;
    subjects: Subject[];
  }
  
  const curriculumData: Curriculum[] = [
    {
      grade: "1ro de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Educación Artística" }
      ]
    },
    {
      grade: "2do de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Música" }  // Cambiado de Educación Artística a Música
      ]
    },
    {
      grade: "3ro de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Educación Artística" }
      ]
    },
    {
      grade: "4to de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Educación Artística" }
      ]
    },
    {
      grade: "5to de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Educación Artística" }
      ]
    },
    {
      grade: "6to de Primaria",
      subjects: [
        { name: "Lenguaje" },
        { name: "Matemáticas" },
        { name: "Ciencias Naturales" },
        { name: "Ciencias Sociales" },
        { name: "Educación Física" },
        { name: "Educación Artística" }
      ]
    }
  ];
  
export default curriculumData;
  